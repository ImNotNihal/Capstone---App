"use client"; // Mandatory for Context in Expo Router

import { Toast } from "@/src/components/toast";
import { API_BASE_URL } from "@/src/config";
import { AppStorage } from "@/src/hooks/useAppStorage";
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export interface RequestLogEntry {
    id: string;
    timestamp: Date;
    method: string;
    url: string;
    path: string;
    status: "pending" | "pass" | "fail";
    statusCode?: number;
    responseData?: any;
    errorMessage?: string;
    durationMs?: number;
}

export const AppContext = createContext<any>(null);

const FETCH_TIMEOUT_MS = 8000;

function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // Tracks initial session restoration

    const base_url = API_BASE_URL;
    const [isLocked, setIsLocked] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [toastContent, setToastContent] = useState<{
        title: string;
        message: string;
        variant: "danger" | "success" | "info" | "warning" | "default";
    }>({
        title: "",
        message: "",
        variant: "default",
    });

    const [isDevMode, setIsDevMode] = useState(false);
    const [requestLogs, setRequestLogs] = useState<RequestLogEntry[]>([]);

    const clearLogs = useCallback(() => setRequestLogs([]), []);
    const isWebBrowser = Platform.OS === "web";
    const wsRef = useRef<WebSocket | null>(null);
    const previousLockState = useRef<boolean | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearReconnectTimeout = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (!isDevMode) return;
        const envGlobal = typeof window !== "undefined" ? window : global;
        const originalFetch = envGlobal.fetch.bind(envGlobal); 
        
        envGlobal.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const id = String(Date.now() + Math.random());
            const method = (init?.method ?? "GET").toUpperCase();
            const rawUrl = typeof input === 'string' ? input : (input && 'url' in input ? input.url : input.toString());
            const path = rawUrl.replace(API_BASE_URL, "").replace(/^\//, "");
            
            const entry: RequestLogEntry = {
                id, method, url: rawUrl, path,
                timestamp: new Date(), status: "pending",
            };
            setRequestLogs(prev => [entry, ...prev]);
            
            const start = Date.now();
            try {
                const response = await originalFetch(input, init);
                const durationMs = Date.now() - start;
                let responseData: any = null;
                try { responseData = await response.clone().json(); } catch {}
                
                setRequestLogs(prev => prev.map(e => e.id === id ? {
                    ...e,
                    status: response.ok ? "pass" : "fail",
                    statusCode: response.status,
                    responseData,
                    errorMessage: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
                    durationMs,
                } : e));
                return response;
            } catch (error: any) {
                const durationMs = Date.now() - start;
                setRequestLogs(prev => prev.map(e => e.id === id ? {
                    ...e,
                    status: "fail",
                    errorMessage: error.name === "AbortError" ? "Request timed out" : (error.message ?? "Unknown error"),
                    durationMs,
                } : e));
                throw error;
            }
        };
        return () => { envGlobal.fetch = originalFetch; };
    }, [isDevMode]);

    const authHeaders = useCallback(() => {
        const headers: Record<string, string> = {};
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
        return headers;
    }, [authToken]);

    const httpLock = () => {
        if (!deviceId) return;
        setIsLocked(true); // optimistic update
        return fetchWithTimeout(`${base_url}send-command/${deviceId}/LOCK`, { method: "POST", headers: authHeaders() })
            .catch(e => {
                setIsLocked(false); // revert on failure
                console.warn("Lock command failed:", e);
            });
    };

    const httpUnlock = () => {
        if (!deviceId) return;
        setIsLocked(false); // optimistic update
        return fetchWithTimeout(`${base_url}send-command/${deviceId}/UNLOCK`, { method: "POST", headers: authHeaders() })
            .catch(e => {
                setIsLocked(true); // revert on failure
                console.warn("Unlock command failed:", e);
            });
    };

    const httpGetLockStatus = () => {
        if (!deviceId) return;
        return fetchWithTimeout(`${base_url}status/${deviceId}`, { method: "GET", headers: authHeaders() })
            .then((response) => response.json())
            .then((data) => {
                if (typeof data?.status === "string") setIsLocked(data.status === "LOCKED");
                return data;
            })
            .catch((e) => console.log("Status fetch error:", e));
    };

    useEffect(() => {
        if (previousLockState.current === null) {
            previousLockState.current = isLocked;
            return;
        }
        setToastContent({
            title: isLocked ? "Door locked" : "Door unlocked",
            message: isLocked ? "Front door is secured." : "Front door is now open.",
            variant: isLocked ? "danger" : "success",
        });
        setToastVisible(true);
        previousLockState.current = isLocked;
    }, [isLocked]);

    // RESTORE SESSION (Now with loading state)
    useEffect(() => {
        AppStorage.getSession()
            .then((storedSession) => {
                if (storedSession?.user) setUser(storedSession.user);
                const storedToken = storedSession?.token || storedSession?.accessToken || storedSession?.access_token;
                if (storedToken) setAuthToken(storedToken);
                const storedDeviceId = storedSession?.user?.deviceId || storedSession?.user?.device_id || null;
                if (storedDeviceId) setDeviceId(storedDeviceId);
            })
            .finally(() => setLoading(false)); // Crucial: enables AuthGuard to proceed
    }, []);

    const connectWebSocket = useCallback(() => {
        if (!deviceId || (wsRef.current && wsRef.current.readyState <= 1)) return;
        clearReconnectTimeout();
        let wsUrl = (base_url || "").replace(/^http/, "ws") + "ws/client";
        if (Platform.OS === "web" && window.location.protocol === "https:") wsUrl = wsUrl.replace(/^ws:/, "wss:");

        const scheduleReconnect = () => {
            if (reconnectTimeoutRef.current) return;
            setIsDeviceConnected(false);
            wsRef.current = null;
            const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttemptsRef.current));
            reconnectAttemptsRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (deviceId) connectWebSocket();
            }, delay);
        };

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            ws.onopen = () => {
                setIsDeviceConnected(true);
                reconnectAttemptsRef.current = 0;
                ws.send(JSON.stringify({ type: "subscribe", deviceId }));
                httpGetLockStatus();
            };
            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === "status" && data.deviceId === deviceId && typeof data.status === "string") {
                        setIsLocked(data.status === "LOCKED");
                    }
                } catch {}
            };
            ws.onerror = scheduleReconnect;
            ws.onclose = scheduleReconnect;
        } catch { scheduleReconnect(); }
    }, [base_url, deviceId]);

    useEffect(() => {
        if (!deviceId) {
            if (wsRef.current) wsRef.current.close();
            return;
        }
        connectWebSocket();
        return () => { if (wsRef.current) wsRef.current.close(); };
    }, [deviceId, connectWebSocket]);

    const signout = async () => {
        await AppStorage.clearSession();
        setUser(null);
        setAuthToken(null);
        setDeviceId(null);
        setIsDevMode(false);
        if (wsRef.current) wsRef.current.close();
    };

    const signin = async (email: string, password: string) => {
        if (email === "test" && password === "test") setIsDevMode(true);
        const response = await fetchWithTimeout(`${base_url}auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) throw new Error("Invalid credentials");
        const data = await response.json();
        const token = data?.access_token ?? data?.token ?? null;
        setUser(data.user);
        if (token) setAuthToken(token);
        await AppStorage.setSession({ user: data.user, token, refreshToken: data?.refresh_token });
        if (data.user?.deviceId || data.user?.device_id) setDeviceId(data.user?.deviceId ?? data.user?.device_id);
    };

    const signup = async (payload: any) => {
        const response = await fetchWithTimeout(`${base_url}auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Sign up failed");
        const data = await response.json();
        const token = data?.access_token ?? data?.token ?? null;
        setUser(data.user);
        if (token) setAuthToken(token);
        await AppStorage.setSession({ user: data.user, token, refreshToken: data?.refresh_token });
        if (data.user?.deviceId || data.user?.device_id) setDeviceId(data.user?.deviceId ?? data.user?.device_id);
    };

    const contextValue = {
        user, loading, deviceId, httpLock, httpUnlock, isLocked,
        signin, signup, signout, authToken, isWebBrowser,
        cameraBaseUrl: deviceId ? `${base_url}camera/${deviceId}` : null,
        isDeviceConnected, isDevMode, requestLogs, clearLogs,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
            <Toast visible={toastVisible} title={toastContent.title} message={toastContent.message}
                variant={toastContent.variant} placement="top" offset={88} onDismiss={() => setToastVisible(false)} />
        </AppContext.Provider>
    );
};