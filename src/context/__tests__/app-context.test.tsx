/**
 * Tests for AppProvider / AppContext.
 *
 * Regression tests verify fixes for specific bugs:
 * - fetchWithTimeout aborts hanging requests after the timeout deadline
 * - session restore does NOT fall back to a hardcoded deviceId when no session exists
 * - WebSocket double-reconnect is prevented (onerror + onclose both firing)
 */

import React, { useContext } from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { AppContext, AppProvider } from "../app-context";
import { AppStorage } from "@/src/hooks/useAppStorage";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/src/hooks/useAppStorage", () => ({
    AppStorage: {
        getSession: jest.fn(),
        setSession: jest.fn(),
        clearSession: jest.fn(),
    },
}));

// Suppress Toast (native module not relevant to these tests)
jest.mock("@/src/components/toast", () => ({
    Toast: () => null,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Render a hook inside AppProvider and expose the context value. */
const renderWithProvider = () =>
    renderHook(() => useContext(AppContext), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <AppProvider>{children}</AppProvider>
        ),
    });

// ─── WebSocket mock ───────────────────────────────────────────────────────────

class MockWebSocket {
    static instances: MockWebSocket[] = [];
    readyState = WebSocket.CONNECTING;
    onopen: (() => void) | null = null;
    onclose: ((e: any) => void) | null = null;
    onerror: ((e: any) => void) | null = null;
    onmessage: ((e: any) => void) | null = null;
    send = jest.fn();
    close = jest.fn(() => { this.readyState = WebSocket.CLOSED; });

    constructor(public url: string) {
        MockWebSocket.instances.push(this);
    }

    /** Simulate a successful connection. */
    open() {
        this.readyState = WebSocket.OPEN;
        this.onopen?.();
    }

    /** Simulate error then close (what happens on a network failure). */
    failWithErrorAndClose() {
        this.onerror?.({ type: "error" });
        this.onclose?.({ code: 1006, reason: "Network error" });
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AppContext – session restore", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: "LOCKED" }),
        });
        // Install mock WebSocket
        MockWebSocket.instances = [];
        (global as any).WebSocket = MockWebSocket;
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    it("restores user and token from stored session", async () => {
        (AppStorage.getSession as jest.Mock).mockResolvedValueOnce({
            user: { id: "u1", email: "alice@example.com", deviceId: "lock_ABC" },
            token: "stored-token",
        });

        const { result } = renderWithProvider();

        await waitFor(() => expect(result.current.user).not.toBeNull());

        expect(result.current.user.email).toBe("alice@example.com");
        expect(result.current.authToken).toBe("stored-token");
        expect(result.current.deviceId).toBe("lock_ABC");
    });

    // Regression: previously, session restore always set deviceId to the
    // hardcoded string "smartlock_5C567740C86C" even with no stored session,
    // causing spurious WebSocket connections for unauthenticated users.
    it("does NOT set a deviceId when there is no stored session (regression)", async () => {
        (AppStorage.getSession as jest.Mock).mockResolvedValueOnce(null);

        const { result } = renderWithProvider();

        // Give the async session restore a chance to complete
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.deviceId).toBeNull();
    });

    it("does NOT set a deviceId when the stored session has no deviceId", async () => {
        (AppStorage.getSession as jest.Mock).mockResolvedValueOnce({
            user: { id: "u1", email: "bob@example.com" }, // no deviceId
            token: "some-token",
        });

        const { result } = renderWithProvider();

        await act(async () => { await Promise.resolve(); });

        expect(result.current.deviceId).toBeNull();
    });
});

describe("AppContext – signin", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        MockWebSocket.instances = [];
        (global as any).WebSocket = MockWebSocket;
        (AppStorage.getSession as jest.Mock).mockResolvedValue(null);
        (AppStorage.setSession as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    it("sets user, token and deviceId on successful login", async () => {
        const loginResponse = {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            user: { id: "u2", email: "carol@example.com", device_id: "lock_XYZ" },
        };
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => loginResponse,
        });

        const { result } = renderWithProvider();
        await act(async () => { await Promise.resolve(); });

        await act(async () => {
            await result.current.signin("carol@example.com", "password123");
        });

        expect(result.current.user.email).toBe("carol@example.com");
        expect(result.current.authToken).toBe("new-access-token");
        expect(result.current.deviceId).toBe("lock_XYZ");
    });

    it("throws an error with the server detail on failed login", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: "Invalid credentials." }),
        });

        const { result } = renderWithProvider();
        await act(async () => { await Promise.resolve(); });

        await expect(
            act(async () => {
                await result.current.signin("wrong@example.com", "wrong");
            })
        ).rejects.toThrow("Invalid credentials.");
    });

    // Regression: signin called fetch without a timeout so a slow server
    // would hang the UI indefinitely. Now all fetch calls use fetchWithTimeout.
    it("aborts signin after the fetch timeout (regression)", async () => {
        // Simulate a server that never responds
        global.fetch = jest.fn().mockImplementationOnce(
            (_url: string, opts: RequestInit) =>
                new Promise((_resolve, reject) => {
                    // Abort when the controller fires
                    opts.signal?.addEventListener("abort", () =>
                        reject(Object.assign(new Error("Aborted"), { name: "AbortError" }))
                    );
                })
        );

        const { result } = renderWithProvider();
        await act(async () => { await Promise.resolve(); });

        let caughtError: Error | null = null;
        const signinPromise = act(async () => {
            try {
                await result.current.signin("user@example.com", "pass");
            } catch (e: any) {
                caughtError = e;
            }
        });

        // Advance time past the 8-second fetch timeout
        act(() => { jest.advanceTimersByTime(9000); });
        await signinPromise;

        expect(caughtError).not.toBeNull();
        expect((caughtError as Error).name).toBe("AbortError");
    });
});

describe("AppContext – signout", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        MockWebSocket.instances = [];
        (global as any).WebSocket = MockWebSocket;
        (AppStorage.getSession as jest.Mock).mockResolvedValue(null);
        (AppStorage.clearSession as jest.Mock).mockResolvedValue(undefined);
        (AppStorage.setSession as jest.Mock).mockResolvedValue(undefined);
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: "LOCKED" }),
        });
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    it("clears user, token and deviceId on signout", async () => {
        // First sign in
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access_token: "tok",
                user: { id: "u3", email: "dave@example.com", device_id: "lock_DEV" },
            }),
        });

        const { result } = renderWithProvider();
        await act(async () => { await Promise.resolve(); });

        await act(async () => {
            await result.current.signin("dave@example.com", "pw");
        });

        expect(result.current.user).not.toBeNull();

        await act(async () => {
            await result.current.signout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.authToken).toBeNull();
        expect(result.current.deviceId).toBeNull();
    });
});

describe("AppContext – WebSocket reconnect", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        MockWebSocket.instances = [];
        (global as any).WebSocket = MockWebSocket;
        (AppStorage.getSession as jest.Mock).mockResolvedValueOnce({
            user: { id: "u1", deviceId: "lock_REC" },
            token: "tok",
        });
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: "LOCKED" }),
        });
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    // Regression: when a WebSocket connection fails, both onerror and onclose
    // fire. Previously this caused the reconnect counter to increment twice,
    // doubling the backoff delay. The fix guards scheduleReconnect with an
    // early return when a timer is already queued.
    it("increments reconnect counter only once when both onerror and onclose fire (regression)", async () => {
        const { result } = renderWithProvider();

        // Wait for session restore and initial WS connection
        await act(async () => { await Promise.resolve(); });
        await act(async () => { await Promise.resolve(); });

        const ws = MockWebSocket.instances[0];
        expect(ws).toBeDefined();

        // Simulate what happens on a network failure (onerror then onclose)
        act(() => { ws.failWithErrorAndClose(); });

        // After the first failure: attempt 1 → delay = min(30000, 1000 * 2^1) = 2000ms
        // Advance 2 seconds to trigger the reconnect
        act(() => { jest.advanceTimersByTime(2100); });

        // A new WebSocket should have been created (one reconnect, not two)
        expect(MockWebSocket.instances.length).toBe(2);

        // Simulate second failure to verify counter was only incremented once (not twice)
        const ws2 = MockWebSocket.instances[1];
        act(() => { ws2.failWithErrorAndClose(); });

        // Attempt 2 → delay = min(30000, 1000 * 2^2) = 4000ms (not 8000ms if counter doubled)
        act(() => { jest.advanceTimersByTime(4100); });
        expect(MockWebSocket.instances.length).toBe(3);
    });
});
