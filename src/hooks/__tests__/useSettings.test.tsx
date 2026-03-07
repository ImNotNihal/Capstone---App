/**
 * Tests for the useSettings hook.
 *
 * Covers: loading state, successful fetch, error handling (server error +
 * request timeout), optimistic updates, and update revert on failure.
 */

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { AppContext } from "@/src/context/app-context";
import { useSettings } from "../useSettings";

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const DEVICE_ID = "lock_TEST001";
const AUTH_TOKEN = "bearer-test-token";

const BACKEND_SETTINGS = {
    deviceId: DEVICE_ID,
    autoLock: true,
    autoLockTimeout: 30,
    failedAttemptLimit: 5,
    alertsEnabled: false,   // maps to notisEnabled on the frontend
    motionSensitivity: "medium",
    cameraEnabled: true,
};

// Wrap the hook with a minimal AppContext provider.
const makeWrapper =
    (ctxValue = { authToken: AUTH_TOKEN, deviceId: DEVICE_ID }) =>
    ({ children }: { children: React.ReactNode }) => (
        <AppContext.Provider value={ctxValue}>{children}</AppContext.Provider>
    );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useSettings", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    // ── Fetch on mount ────────────────────────────────────────────────────────

    it("starts in a loading state", () => {
        (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper(),
        });
        expect(result.current.loading).toBe(true);
    });

    it("fetches settings on mount and maps alertsEnabled → notisEnabled", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => BACKEND_SETTINGS,
        });

        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Backend alertsEnabled:false → frontend notisEnabled:false
        expect(result.current.settings.notisEnabled).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("uses defaults and skips fetch when deviceId is absent", async () => {
        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper({ authToken: AUTH_TOKEN, deviceId: null }),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(global.fetch).not.toHaveBeenCalled();
        expect(result.current.settings.notisEnabled).toBe(true); // default
    });

    // ── Error handling ────────────────────────────────────────────────────────

    it("sets error message on non-OK server response", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: "Not found" }),
        });

        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe("Not found");
        // Falls back to defaults
        expect(result.current.settings.notisEnabled).toBe(true);
    });

    it("sets 'Server unreachable' error on request timeout (AbortError)", async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() => {
            const err = new Error("Aborted");
            (err as any).name = "AbortError";
            return Promise.reject(err);
        });

        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe("Server unreachable");
    });

    // ── Optimistic update ─────────────────────────────────────────────────────

    it("applies optimistic update immediately, then confirms from server response", async () => {
        // Initial fetch
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...BACKEND_SETTINGS, alertsEnabled: true }),
        });

        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.settings.notisEnabled).toBe(true);

        // Optimistic update: toggle notisEnabled to false
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...BACKEND_SETTINGS, alertsEnabled: false }),
        });

        act(() => {
            result.current.updateSetting("notisEnabled", false);
        });

        // Optimistic update applied immediately
        expect(result.current.settings.notisEnabled).toBe(false);

        await waitFor(() => expect(result.current.updatingKeys.size).toBe(0));
        expect(result.current.settings.notisEnabled).toBe(false);
    });

    it("reverts the optimistic update when the server returns an error", async () => {
        // Initial fetch: notisEnabled is true (alertsEnabled: true on backend)
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...BACKEND_SETTINGS, alertsEnabled: true }),
        });

        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Server rejects the update
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: "Forbidden" }),
        });

        await act(async () => {
            await expect(
                result.current.updateSetting("notisEnabled", false)
            ).rejects.toBeTruthy();
        });

        // Value reverted to original
        expect(result.current.settings.notisEnabled).toBe(true);
    });

    // ── URL and field mapping ─────────────────────────────────────────────────

    it("sends PUT to /settings/{deviceId} (not /user) and maps notisEnabled → alertsEnabled", async () => {
        // Initial fetch
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => BACKEND_SETTINGS,
        });

        const { result } = renderHook(() => useSettings(), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Update call
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...BACKEND_SETTINGS, alertsEnabled: true }),
        });

        await act(async () => {
            await result.current.updateSetting("notisEnabled", true).catch(() => {});
        });

        const putCall = (global.fetch as jest.Mock).mock.calls[1];
        const [url, opts] = putCall;

        // Must NOT have /user suffix
        expect(url).toMatch(/\/settings\/lock_TEST001$/);
        // Must map notisEnabled → alertsEnabled in the body
        const body = JSON.parse(opts.body);
        expect(body).toHaveProperty("alertsEnabled", true);
        expect(body).not.toHaveProperty("notisEnabled");
    });
});
