import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "@/src/context/app-context";

export type DeviceSettings = {
    notisEnabled: boolean;
};

const DEFAULTS: DeviceSettings = {
    notisEnabled: true,
};

type SettingsKey = keyof DeviceSettings;

const FETCH_TIMEOUT_MS = 8000;

/** Wraps fetch with an AbortController timeout */
function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function useSettings() {
    const { authToken, deviceId } = useContext(AppContext);
    const [settings, setSettings] = useState<DeviceSettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingKeys, setUpdatingKeys] = useState<Set<SettingsKey>>(new Set());

    const BASE_URL = "http://192.168.2.208:8000/";

    const headers = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchSettings = useCallback(async () => {
        if (!deviceId || !authToken) {
            setSettings(DEFAULTS);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetchWithTimeout(
                `${BASE_URL}settings/${deviceId}`,
                { method: "GET", headers: headers() },
                FETCH_TIMEOUT_MS,
            );

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body?.detail || "Failed to load settings");
            }

            const data = await response.json();
            setSettings({
                notisEnabled: data.notisEnabled ?? DEFAULTS.notisEnabled,
            });
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
        async (key: SettingsKey, value: boolean) => {
            if (!deviceId) return;

            const previousValue = settings[key];
            setSettings((prev) => ({ ...prev, [key]: value }));
            setUpdatingKeys((prev) => new Set(prev).add(key));

            try {
                const response = await fetchWithTimeout(
                    `${BASE_URL}settings/${deviceId}/user`,
                    {
                        method: "PUT",
                        headers: headers(),
                        body: JSON.stringify({ [key]: value }),
                    },
                    FETCH_TIMEOUT_MS,
                );

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(body?.detail || "Failed to update setting");
                }

                const data = await response.json();
                if (data.settings) {
                    setSettings({
                        notisEnabled: data.settings.notisEnabled ?? DEFAULTS.notisEnabled,
                    });
                }
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
