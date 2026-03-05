import { createContext, ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { Toast } from "@/src/components/toast";
import { AppStorage } from "@/src/hooks/useAppStorage";
import { Platform } from "react-native";
// import Config from 'react-native-config';

export const AppContext = createContext<any>(null);

// const EXPO_PUBLIC_API_URL="http://192.168.2.208:8000/"
const EXPO_PUBLIC_API_URL="https://smart-doorlock-server-851342133148.europe-west1.run.app/"

// const EXPO_PUBLIC_API_URL=""

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    // const base_url = process.env.EXPO_PUBLIC_API_URL + '/';
    // let EXPO_PUBLIC_API_URL="http://172.30.20.117:8000/"

    const base_url = EXPO_PUBLIC_API_URL;
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

    const cameraBaseUrl = "http://192.168.2.209:81";
    const isWebBrowser = Platform.OS === "web";

    const wsRef = useRef<WebSocket | null>(null);
    const previousLockState = useRef<boolean | null>(null);

    // NEW: reconnection state
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearReconnectTimeout = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    };

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
        return fetch(url, { method: "POST", headers: authHeaders() });
    };

    const httpUnlock = () => {
        if (!deviceId) return;
        const url = `${base_url}send-command/${deviceId}/UNLOCK`;
        console.log("Sending unlock command to:", url);
        return fetch(url, { method: "POST", headers: authHeaders() });
    };

    const httpGetLockStatus = () => {
        if (!deviceId) return;

        const url = `${base_url}status/${deviceId}`;
        return fetch(url, { method: "GET", headers: authHeaders() })
            .then((response) => response.json())
            .then((data) => {
                const status = data?.status;
                console.log("Status:", data);
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

    // Restore session once on app start
    useEffect(() => {
        const storedSession = AppStorage.getSession();
        if (storedSession?.user) {
            setUser(storedSession.user);
        }
        const storedToken =
            storedSession?.token || storedSession?.accessToken || storedSession?.access_token;
        if (storedToken) {
            setAuthToken(storedToken);
        }

        const fallbackDeviceId =
            storedSession?.user?.deviceId ||
            storedSession?.user?.device_id ||
            "smartlock_5C567740C86C";
        setDeviceId(fallbackDeviceId);
    }, []);

    // ========== WebSocket connection + async reconnection ==========
    const connectWebSocket = useCallback(() => {
        if (!deviceId) {
            console.log("WS: no deviceId, skipping connect");
            return;
        }

        // If there is already an open or connecting socket, don't recreate
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            console.log("WS: already connected/connecting, skipping new connection");
            return;
        }

        // Clear any scheduled reconnection attempt when we actively connect
        clearReconnectTimeout();

        const wsUrl =
            (base_url || "")
                .replace(/^http:\/\//, "ws://")
                .replace(/^https:\/\//, "wss://") + "ws/client";

        console.log("Connecting WS client to:", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Client WS connected");
            setIsDeviceConnected(true);
            reconnectAttemptsRef.current = 0; // reset backoff

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

        const scheduleReconnect = () => {
            setIsDeviceConnected(false);
            wsRef.current = null;

            const attempt = reconnectAttemptsRef.current;
            const delay = Math.min(30000, 1000 * Math.pow(2, attempt)); // 1s, 2s, 4s, ... max 30s
            reconnectAttemptsRef.current = attempt + 1;

            console.log(`WS: scheduling reconnect in ${delay}ms (attempt ${attempt + 1})`);

            clearReconnectTimeout();
            reconnectTimeoutRef.current = setTimeout(() => {
                // Only try if still no socket and we still have a deviceId
                if (!wsRef.current && deviceId) {
                    connectWebSocket();
                }
            }, delay);
        };

        ws.onerror = (event) => {
            console.log("WS error:", event);
            // In RN, onerror is followed by onclose, but we can be defensive:
            scheduleReconnect();
        };

        ws.onclose = (event) => {
            console.log("Client WS closed:", event?.code, event?.reason);
            scheduleReconnect();
        };
    }, [base_url, deviceId]);

    // Create/cleanup WS when deviceId changes
    useEffect(() => {
        if (!deviceId) {
            // No device => ensure socket & timers are cleared
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

    const signout = () => {
        AppStorage.clearSession();
        setUser(null);
        setAuthToken(null);
        setDeviceId(null);

        clearReconnectTimeout();
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsDeviceConnected(false);
    };

    // signin / signup code unchanged ...

    const signin = async (email: string, password: string) => {
        if(email=== "test" && password === "test"){
            const data = {user:{
                "id": 1,
                "email": "",
                "firstName": "test",
                "lastName": "test",
                "device_id": "smartlock_5C567740C86C",
            },
            token: "1"}

            setUser(data.user);
            setAuthToken(data.token);
            AppStorage.setSession({ user: data.user, token: data.token });

            if (data.user?.device_id) {
                setDeviceId(data.user.device_id);
            }
            return
        }
        const response = await fetch(`${base_url}auth/login`, {
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
        console.log("Signin response:", data);
        const accessToken = data?.access_token ?? data?.token ?? null;
        const refreshToken = data?.refresh_token ?? null;
        setUser(data.user);
        if (accessToken) {
            console.log("Got access token:", accessToken);
            setAuthToken(accessToken);
        }
        AppStorage.setSession({ user: data.user, token: accessToken, refreshToken });

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
        const response = await fetch(`${base_url}auth/signup`, {
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
        AppStorage.setSession({ user: data.user, token: accessToken, refreshToken });

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
        isDeviceConnected, // <- now reflects WS status
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
