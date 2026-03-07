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

    // ========== Dev-mode fetch interceptor ==========
    useEffect(() => {
        if (!isDevMode) return;
        
        // 1. Safely target the correct environment global (window for web, global for native)
        const envGlobal = typeof window !== "undefined" ? window : global;
        
        // 2. Bind strictly to that environment to prevent Illegal Invocation
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
        
        return () => { 
            // 3. Restore the correct environment fetch on cleanup
            envGlobal.fetch = originalFetch; 
        };
    }, [isDevMode]);

    const authHeaders = useCallback(() => {
        const headers: Record<string, string> = {};
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }
        return headers;
    }, [authToken]);

    const httpLock = () => {
        if (!deviceId) return;
        const url = `${base_url}send-command/${deviceId}/LOCK`;
        return fetchWithTimeout(url, { method: "POST", headers: authHeaders() })
            .catch(e => console.warn("Lock command failed:", e));
    };

    const httpUnlock = () => {
        if (!deviceId) return;
        const url = `${base_url}send-command/${deviceId}/UNLOCK`;
        return fetchWithTimeout(url, { method: "POST", headers: authHeaders() })
            .catch(e => console.warn("Unlock command failed:", e));
    };

    const httpGetLockStatus = () => {
        if (!deviceId) return;

        const url = `${base_url}status/${deviceId}`;
        return fetchWithTimeout(url, { method: "GET", headers: authHeaders() })
            .then((response) => response.json())
            .then((data) => {
                const status = data?.status;
                if (typeof status === "string") {
                    setIsLocked(status === "LOCKED");
                }
                return data;
            })
            .catch((e) => {
                console.log("Status fetch error:", e);
            });
    };

    // Toast on lock state change
    useEffect(() => {
        if (previousLockState.current === null) {
            previousLockState.current = isLocked;
            return;
        }

        const lockedNow = isLocked;
        setToastContent({
            title: lockedNow ? "Door locked" : "Door unlocked",
            message: lockedNow ? "Front door is secured." : "Front door is now open.",
            variant: lockedNow ? "danger" : "success",
        });
        setToastVisible(true);
        previousLockState.current = lockedNow;
    }, [isLocked]);

    // Restore session once on app start (async-safe)
    useEffect(() => {
        AppStorage.getSession().then((storedSession) => {
            if (storedSession?.user) {
                setUser(storedSession.user);
            }
            const storedToken =
                storedSession?.token || storedSession?.accessToken || storedSession?.access_token;
            if (storedToken) {
                setAuthToken(storedToken);
            }

            const storedDeviceId =
                storedSession?.user?.deviceId ||
                storedSession?.user?.device_id ||
                null;
            if (storedDeviceId) {
                setDeviceId(storedDeviceId);
            }
        });
    }, []);

    // ========== WebSocket connection + async reconnection ==========
    const connectWebSocket = useCallback(() => {
        if (!deviceId) {
            console.log("WS: no deviceId, skipping connect");
            return;
        }

        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            console.log("WS: already connected/connecting, skipping new connection");
            return;
        }

        clearReconnectTimeout();

        let wsUrl = (base_url || "")
            .replace(/^http:\/\//, "ws://")
            .replace(/^https:\/\//, "wss://") + "ws/client";

        // FIX: Prevent "The operation is insecure" Mixed Content errors on web
        if (Platform.OS === "web" && typeof window !== "undefined" && window.location.protocol === "https:") {
            wsUrl = wsUrl.replace(/^ws:\/\//, "wss://");
        }

        console.log("Connecting WS client to:", wsUrl);

        // 1. Move scheduleReconnect ABOVE so it can be used in the catch block
        const scheduleReconnect = () => {
            if (reconnectTimeoutRef.current) return;

            setIsDeviceConnected(false);
            wsRef.current = null;

            const attempt = reconnectAttemptsRef.current;
            const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
            reconnectAttemptsRef.current = attempt + 1;

            console.log(`WS: scheduling reconnect in ${delay}ms (attempt ${attempt + 1})`);

            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (!wsRef.current && deviceId) {
                    connectWebSocket();
                }
            }, delay);
        };

        // 2. Wrap WebSocket initialization in a try/catch
        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Client WS connected");
                setIsDeviceConnected(true);
                reconnectAttemptsRef.current = 0;

                const subMsg = JSON.stringify({
                    type: "subscribe",
                    deviceId: deviceId,
                });
                ws.send(subMsg);

                httpGetLockStatus();
            };

            ws.onmessage = (event) => {
                try {
                    console.log("WS message:", event.data);
                    const data = JSON.parse(event.data);
                    if (data.type === "status" && data.deviceId === deviceId) {
                        if (typeof data.status === "string") {
                            setIsLocked(data.status === "LOCKED");
                        }
                    }
                } catch (e) {
                    console.log("WS message parse error:", e);
                }
            };

            ws.onerror = (event) => {
                console.log("WS error:", event);
                scheduleReconnect();
            };

            ws.onclose = (event) => {
                console.log("Client WS closed:", event?.code, event?.reason);
                scheduleReconnect();
            };
        } catch (error) {
            // Safely catch SecurityError and fallback to retry without crashing React
            console.error("Failed to construct WebSocket safely:", error);
            scheduleReconnect();
        }
    }, [base_url, deviceId]);

    // Create/cleanup WS when deviceId changes
    useEffect(() => {
        if (!deviceId) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            clearReconnectTimeout();
            setIsDeviceConnected(false);
            return;
        }

        connectWebSocket();

        return () => {
            console.log("Cleaning up WS for device:", deviceId);
            clearReconnectTimeout();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            setIsDeviceConnected(false);
        };
    }, [deviceId, connectWebSocket]);

    const signout = async () => {
        await AppStorage.clearSession();
        setUser(null);
        setAuthToken(null);
        setDeviceId(null);
        setIsDevMode(false);
        setRequestLogs([]);

        clearReconnectTimeout();
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsDeviceConnected(false);
    };

    const signin = async (email: string, password: string) => {
        // Enable request logging if it's the test account
        if (email === "test" && password === "test") {
            setIsDevMode(true);
        }

        // Send the credentials to the REAL backend for all accounts, including 'test'
        const response = await fetchWithTimeout(`${base_url}auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message =
                errorBody?.detail || "Invalid credentials. Please try again.";
            throw new Error(message);
        }

        const data = await response.json();
        const accessToken = data?.access_token ?? data?.token ?? null;
        const refreshToken = data?.refresh_token ?? null;
        setUser(data.user);
        
        if (accessToken) {
            setAuthToken(accessToken);
        }
        
        await AppStorage.setSession({ user: data.user, token: accessToken, refreshToken });

        const nextDeviceId = data.user?.deviceId ?? data.user?.device_id;
        if (nextDeviceId) {
            setDeviceId(nextDeviceId);
        }
    };

    const signup = async (payload: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) => {
        const response = await fetchWithTimeout(`${base_url}auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message =
                errorBody?.detail || "Sign up failed. Please try again.";
            throw new Error(message);
        }

        const data = await response.json();
        const accessToken = data?.access_token ?? data?.token ?? null;
        const refreshToken = data?.refresh_token ?? null;
        setUser(data.user);
        if (accessToken) {
            setAuthToken(accessToken);
        }
        await AppStorage.setSession({ user: data.user, token: accessToken, refreshToken });

        const nextDeviceId = data.user?.deviceId ?? data.user?.device_id;
        if (nextDeviceId) {
            setDeviceId(nextDeviceId);
        }
    };

    const getCameraBaseUrl = () => {
        if (!deviceId) return null;
        return `${base_url}camera/${deviceId}`;
    };

    const contextValue = {
        user,
        deviceId,
        httpLock,
        httpUnlock,
        isLocked,
        signin,
        signup,
        signout,
        authToken,
        isWebBrowser,
        cameraBaseUrl: getCameraBaseUrl(),
        isDeviceConnected,
        isDevMode,
        requestLogs,
        clearLogs,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
            <Toast
                visible={toastVisible}
                title={toastContent.title}
                message={toastContent.message}
                variant={toastContent.variant}
                placement="top"
                offset={88}
                onDismiss={() => setToastVisible(false)}
            />
        </AppContext.Provider>
    );
};
