import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "@/src/context/app-context";
import { API_BASE_URL } from "@/src/config";

export type DeviceSettings = {
    notisEnabled: boolean;
    autoLock: boolean;
    autoLockTimeout: number;   // seconds
    failedAttemptLimit: number;
    motionSensitivity: string; // "low" | "medium" | "high"
    cameraEnabled: boolean;
};

const DEFAULTS: DeviceSettings = {
    notisEnabled: true,
    autoLock: true,
    autoLockTimeout: 30,
    failedAttemptLimit: 5,
    motionSensitivity: "medium",
    cameraEnabled: true,
};

type SettingsKey = keyof DeviceSettings;

const FETCH_TIMEOUT_MS = 8000;

function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function mapResponse(data: any): DeviceSettings {
    return {
        notisEnabled: data.alertsEnabled ?? data.notisEnabled ?? DEFAULTS.notisEnabled,
        autoLock: data.autoLock ?? DEFAULTS.autoLock,
        autoLockTimeout: data.autoLockTimeout ?? DEFAULTS.autoLockTimeout,
        failedAttemptLimit: data.failedAttemptLimit ?? DEFAULTS.failedAttemptLimit,
        motionSensitivity: data.motionSensitivity ?? DEFAULTS.motionSensitivity,
        cameraEnabled: data.cameraEnabled ?? DEFAULTS.cameraEnabled,
    };
}

// Map frontend key → backend key
function toBackendKey(key: SettingsKey): string {
    if (key === "notisEnabled") return "alertsEnabled";
    return key;
}

export function useSettings() {
    const { authToken, deviceId } = useContext(AppContext);
    const [settings, setSettings] = useState<DeviceSettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingKeys, setUpdatingKeys] = useState<Set<SettingsKey>>(new Set());

    const headers = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchSettings = useCallback(async () => {
        if (!deviceId) {
            setSettings(DEFAULTS);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetchWithTimeout(
                `${API_BASE_URL}settings/${deviceId}`,
                { method: "GET", headers: headers() },
                FETCH_TIMEOUT_MS,
            );

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body?.detail || "Failed to load settings");
            }

            const data = await response.json();
            setSettings(mapResponse(data));
        } catch (e: any) {
            console.log("Settings fetch error:", e);
            setError(e.name === "AbortError" ? "Server unreachable" : (e.message || "Failed to load settings"));
            setSettings(DEFAULTS);
        } finally {
            setLoading(false);
        }
    }, [deviceId, authToken, headers]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateSetting = useCallback(
        async (key: SettingsKey, value: boolean | number | string) => {
            if (!deviceId) return;

            const previousValue = settings[key];
            setSettings((prev) => ({ ...prev, [key]: value }));
            setUpdatingKeys((prev) => new Set(prev).add(key));

            try {
                const backendKey = toBackendKey(key);
                const response = await fetchWithTimeout(
                    `${API_BASE_URL}settings/${deviceId}`,
                    {
                        method: "PUT",
                        headers: headers(),
                        body: JSON.stringify({ [backendKey]: value }),
                    },
                    FETCH_TIMEOUT_MS,
                );

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(body?.detail || "Failed to update setting");
                }

                const data = await response.json();
                setSettings(mapResponse(data));
            } catch (e: any) {
                console.log("Settings update error:", e);
                setSettings((prev) => ({ ...prev, [key]: previousValue }));
                throw e;
            } finally {
                setUpdatingKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        },
        [deviceId, headers, settings],
    );

    return {
        settings,
        loading,
        error,
        updatingKeys,
        updateSetting,
        refetch: fetchSettings,
    };
}
