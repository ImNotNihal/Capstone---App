/**
 * Tests for AppStorage cross-platform storage abstraction.
 *
 * These tests exercise both the web (localStorage) and native (AsyncStorage)
 * code paths, and include regression tests for bugs that were fixed.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { AppStorage } from "../useAppStorage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockPlatform = (os: "web" | "ios" | "android") => {
    Object.defineProperty(Platform, "OS", { value: os, configurable: true });
};

const validSession = {
    user: { id: "u1", email: "alice@example.com", deviceId: "lock_ABC123" },
    token: "access-token-xyz",
    refreshToken: "refresh-token-xyz",
};

// ─── Native (AsyncStorage) path ───────────────────────────────────────────────

describe("AppStorage – native platform", () => {
    beforeEach(() => {
        mockPlatform("ios");
        (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
        jest.clearAllMocks();
    });

    it("getSession returns null when nothing is stored", async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
        const result = await AppStorage.getSession();
        expect(result).toBeNull();
    });

    it("getSession returns the parsed session object", async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
            JSON.stringify(validSession)
        );
        const result = await AppStorage.getSession();
        expect(result).toEqual(validSession);
    });

    // Regression: corrupted JSON in AsyncStorage previously crashed the app.
    it("getSession returns null for corrupted JSON (regression)", async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
            "{{NOT_VALID_JSON]]["
        );
        const result = await AppStorage.getSession();
        expect(result).toBeNull();
    });

    it("setSession serialises the session and writes to AsyncStorage", async () => {
        (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
        await AppStorage.setSession(validSession);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "session",
            JSON.stringify(validSession)
        );
    });

    it("clearSession removes session and user keys", async () => {
        (AsyncStorage.multiRemove as jest.Mock).mockResolvedValueOnce(undefined);
        await AppStorage.clearSession();
        expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(["session", "user"]);
    });
});

// ─── Web (localStorage) path ──────────────────────────────────────────────────

describe("AppStorage – web platform", () => {
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: (key: string) => store[key] ?? null,
            setItem: (key: string, value: string) => { store[key] = value; },
            removeItem: (key: string) => { delete store[key]; },
            clear: () => { store = {}; },
        };
    })();

    beforeEach(() => {
        mockPlatform("web");
        Object.defineProperty(global, "localStorage", {
            value: localStorageMock,
            writable: true,
        });
        localStorageMock.clear();
    });

    it("getSession returns null when nothing is stored", async () => {
        const result = await AppStorage.getSession();
        expect(result).toBeNull();
    });

    it("getSession returns the parsed session from localStorage", async () => {
        localStorageMock.setItem("session", JSON.stringify(validSession));
        const result = await AppStorage.getSession();
        expect(result).toEqual(validSession);
    });

    // Regression: corrupted localStorage JSON previously crashed the app.
    it("getSession returns null for corrupted JSON in localStorage (regression)", async () => {
        localStorageMock.setItem("session", "<<<CORRUPT>>>");
        const result = await AppStorage.getSession();
        expect(result).toBeNull();
    });

    it("setSession writes JSON to localStorage", async () => {
        await AppStorage.setSession(validSession);
        const stored = localStorageMock.getItem("session");
        expect(JSON.parse(stored!)).toEqual(validSession);
    });

    it("clearSession removes session and user from localStorage", async () => {
        localStorageMock.setItem("session", "{}");
        localStorageMock.setItem("user", "{}");
        await AppStorage.clearSession();
        expect(localStorageMock.getItem("session")).toBeNull();
        expect(localStorageMock.getItem("user")).toBeNull();
    });
});
