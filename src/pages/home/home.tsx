import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ImageBackground,
    useWindowDimensions,
    ScrollView,
    Animated,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { AppContext } from "../../context/app-context";
import { useContext } from "react";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import { Platform } from "react-native";
import { API_BASE_URL } from "@/src/config";

const EVENT_LABELS: Record<string, string> = {
    LOCKED: "Door locked",
    UNLOCKED: "Door unlocked",
    MOTION_DETECTED: "Motion detected",
    FACE_RECOGNIZED: "Face recognized",
    FACE_UNKNOWN: "Unknown face detected",
    FINGERPRINT_SUCCESS: "Fingerprint accepted",
    FINGERPRINT_FAILED: "Fingerprint scan failed",
    KEYPAD_SUCCESS: "Keypad code accepted",
    KEYPAD_FAILED: "Incorrect keypad code",
    DOOR_OPENED: "Door opened",
    DOOR_CLOSED: "Door closed",
    CAMERA_TRIGGERED: "Camera recording started",
    AUTH_FAILED: "Failed authentication attempt",
};

const METHOD_LABELS: Record<string, string> = {
    face: "Face Recognition",
    fingerprint: "Fingerprint",
    keypad: "Keypad PIN",
    bluetooth: "Bluetooth",
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function Home() {
    const { user, deviceId, httpLock, httpUnlock, isLocked, authToken } = useContext(AppContext);
    const router = useRouter();
    const [isCallActive, setIsCallActive] = useState(false);

    // Last activity
    const [lastEvent, setLastEvent] = useState<{ type: string; timestamp: string } | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);

    // Active access methods
    const [activeMethods, setActiveMethods] = useState<string[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(true);

    const toggleLock = () => (isLocked ? httpUnlock() : httpLock());
    const toggleCall = () => setIsCallActive((prev) => !prev);

    const authHeaders = useCallback(() => {
        const h: Record<string, string> = {};
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchLastActivity = useCallback(async () => {
        if (!deviceId || !authToken) {
            setLoadingEvent(false);
            return;
        }
        setLoadingEvent(true);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/events?limit=1`, {
                headers: authHeaders(),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setLastEvent({ type: data[0].type, timestamp: data[0].timestamp });
            } else {
                setLastEvent(null);
            }
        } catch {
            setLastEvent(null);
        } finally {
            setLoadingEvent(false);
        }
    }, [deviceId, authToken, authHeaders]);

    const fetchActiveMethods = useCallback(async () => {
        if (!authToken) {
            setLoadingMethods(false);
            return;
        }
        setLoadingMethods(true);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${API_BASE_URL}credentials/me`, {
                headers: authHeaders(),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const methods = data.authMethods || {};
            const active = Object.entries(methods)
                .filter(([, v]: [string, any]) => v?.isActive)
                .map(([k]) => k);
            setActiveMethods(active);
        } catch {
            setActiveMethods([]);
        } finally {
            setLoadingMethods(false);
        }
    }, [authToken, authHeaders]);

    useFocusEffect(
        useCallback(() => {
            fetchLastActivity();
            fetchActiveMethods();
        }, [fetchLastActivity, fetchActiveMethods])
    );

    if (!user) {
        return (
            <View style={authStyles.container}>
                <Text style={authStyles.title}>You are not logged in</Text>
                <Text style={authStyles.subtitle}>Log in from Settings to use the app.</Text>
                <TouchableOpacity onPress={() => router.push("/settings")} style={authStyles.button}>
                    <Text style={authStyles.buttonText}>Go to Settings</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, flexDirection: "column" }}>
            {/* Header */}
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#e4e4e7" }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "600" }}>Front Door</Text>
                    <LockedStatus locked={isLocked} />
                </View>
                <Text style={{ color: "#6b7280" }}>Live View</Text>
            </View>

            {/* Live Camera Feed */}
            <CameraFeed isCallActive={isCallActive} />

            {/* Quick Actions + Status Cards */}
            <View style={{ padding: 16, flex: 1 }}>
                {/* Quick Actions */}
                <View style={{ flexDirection: "row", marginBottom: 16 }}>
                    <LockButton locked={isLocked} onLockCallback={toggleLock} />
                    <StartCallButton callActive={isCallActive} onStartCallCallback={toggleCall} />
                </View>

                {/* Status Cards */}
                <View style={{ rowGap: 12 }}>
                    {/* Last Activity Card */}
                    <View style={cardStyle.card}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={cardStyle.iconWrap}>
                                <Image
                                    source={require("../../assets/images/bell.png")}
                                    style={{ width: 20, height: 20, tintColor: "#2563eb" }}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: "500" }}>Last Activity</Text>
                                {loadingEvent ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#9ca3af"
                                        style={{ alignSelf: "flex-start", marginTop: 4 }}
                                    />
                                ) : lastEvent ? (
                                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                                        {EVENT_LABELS[lastEvent.type] ?? lastEvent.type}
                                        {" • "}
                                        {timeAgo(lastEvent.timestamp)}
                                    </Text>
                                ) : (
                                    <Text style={{ fontSize: 13, color: "#9ca3af" }}>No recent activity</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Access Methods Card */}
                    <View style={cardStyle.card}>
                        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                            Active Access Methods
                        </Text>

                        {loadingMethods ? (
                            <View style={{ alignItems: "center", paddingVertical: 12 }}>
                                <ActivityIndicator size="small" color="#2563eb" />
                                <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                                    Loading methods...
                                </Text>
                            </View>
                        ) : activeMethods.length === 0 ? (
                            <View style={{ alignItems: "center", paddingVertical: 12 }}>
                                <Text style={{ fontSize: 14, color: "#6b7280" }}>No access methods enabled</Text>
                                <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                                    Configure in Settings → Manage Users
                                </Text>
                            </View>
                        ) : (
                            <View style={{ rowGap: 8 }}>
                                {activeMethods.map((method) => (
                                    <View
                                        key={method}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: 8,
                                            borderRadius: 10,
                                            backgroundColor: "#f4f4f5",
                                        }}
                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <View
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 16,
                                                    backgroundColor: "#2563eb",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    marginRight: 8,
                                                }}
                                            >
                                                <Text style={{ color: "white", fontWeight: "600", fontSize: 11 }}>
                                                    {method[0].toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 14 }}>
                                                {METHOD_LABELS[method] ?? method}
                                            </Text>
                                        </View>
                                        <BadgeOutline>Active</BadgeOutline>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const cardStyle = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "white",
    },
    iconWrap: {
        backgroundColor: "rgba(59,130,246,0.12)",
        padding: 8,
        borderRadius: 12,
        marginRight: 12,
    },
});

/* Camera Feed */
const CameraFeed = ({ isCallActive }: { isCallActive: boolean }) => {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 800;
    const { cameraBaseUrl, isWebBrowser, authToken } = useContext(AppContext);
    const [source, setSource] = useState("");
    const [webViewKey, setWebViewKey] = useState(0);
    const upscale = 2;

    useFocusEffect(
        useCallback(() => {
            if (cameraBaseUrl) {
                setSource(`${cameraBaseUrl}/stream?ts=${Date.now()}`);
                setWebViewKey((prev) => prev + 1);
            }
            return () => {
                setSource("");
            };
        }, [cameraBaseUrl])
    );

    return (
        <View style={{ backgroundColor: "black" }}>
            <View
                style={{
                    marginHorizontal: 16,
                    marginVertical: 16,
                    borderRadius: 12,
                    overflow: "hidden",
                    alignSelf: "center",
                    width: "100%",
                    maxWidth: isLargeScreen ? 900 : "100%",
                }}
            >
                <View style={{ width: "100%", flex: 3, aspectRatio: 16 / 9, overflow: "hidden" }}>
                    {source ? (
                        isWebBrowser ? (
                            <img
                                src={source}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    transform: `scale(${upscale})`,
                                    transformOrigin: "center",
                                    imageRendering: "pixelated",
                                }}
                                alt={"camera feed"}
                            />
                        ) : (
                            <WebView
                                key={webViewKey}
                                source={{
                                    uri: source,
                                    headers: authToken
                                        ? { Authorization: `Bearer ${authToken}` }
                                        : undefined,
                                }}
                                scalesPageToFit={true}
                                style={{ flex: 1, transform: [{ scale: upscale }] }}
                                javaScriptEnabled
                                domStorageEnabled
                            />
                        )
                    ) : (
                        <ImageBackground
                            source={require("../../assets/images/camera-feed-test.png")}
                            style={{ flex: 1 }}
                            imageStyle={{ resizeMode: "cover" }}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

/* Quick Actions */
const StartCallButton = ({
    callActive,
    onStartCallCallback,
}: {
    callActive: boolean;
    onStartCallCallback: () => void;
}) => {
    const micIcon = require("../../assets/images/mic.png");
    const phoneIcon = require("../../assets/images/phone.png");
    const backgroundColor = callActive ? "#ef4444" : "transparent";
    const borderColor = callActive ? "#ef4444" : "#d4d4d8";
    const textColor = callActive ? "white" : "#111827";
    return (
        <TouchableOpacity
            onPress={onStartCallCallback}
            style={{
                flex: 1,
                height: 80,
                marginLeft: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                backgroundColor,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
            <Image
                source={callActive ? phoneIcon : micIcon}
                style={{ width: 24, height: 24, marginBottom: 6, tintColor: textColor }}
            />
            <Text style={{ color: textColor, fontWeight: "600", fontSize: 14 }}>
                {callActive ? "End Call" : "Start Call"}
            </Text>
        </TouchableOpacity>
    );
};

const LockButton = ({ locked, onLockCallback }: { locked: boolean; onLockCallback: () => void }) => {
    const lockedIcon = require("../../assets/images/lock.png");
    const unlockedIcon = require("../../assets/images/lock-open.png");
    const backgroundColor = locked ? "#111827" : "#ef4444";
    const text = locked ? "Unlock Door" : "Lock Door";
    const icon = locked ? unlockedIcon : lockedIcon;
    return (
        <TouchableOpacity
            onPress={onLockCallback}
            style={{
                flex: 1,
                height: 80,
                marginRight: 6,
                borderRadius: 12,
                backgroundColor,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
            <Image source={icon} style={{ width: 24, height: 24, marginBottom: 6, tintColor: "white" }} />
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>{text}</Text>
        </TouchableOpacity>
    );
};

const LockedStatus = ({ locked }: { locked: boolean }) => {
    const lockedIcon = require("../../assets/images/lock.png");
    const unlockedIcon = require("../../assets/images/lock-open.png");
    const bgColor = locked ? "#ef4444" : "#e5e7eb";
    const textColor = locked ? "white" : "#111827";
    const iconTint = locked ? "white" : "#111827";
    return (
        <View
            style={{
                backgroundColor: bgColor,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <Image
                source={locked ? lockedIcon : unlockedIcon}
                style={{ width: 14, height: 14, marginRight: 4, tintColor: iconTint }}
            />
            <Text style={{ color: textColor, fontWeight: "600", fontSize: 12 }}>
                {locked ? "Locked" : "Unlocked"}
            </Text>
        </View>
    );
};

const BadgeOutline = ({ children }: { children: React.ReactNode }) => (
    <View
        style={{
            borderWidth: 1,
            borderColor: "#d4d4d8",
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 2,
        }}
    >
        <Text style={{ fontSize: 12, color: "#111827" }}>{children}</Text>
    </View>
);

const authStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#fff",
        rowGap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
    },
    button: {
        marginTop: 4,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: "#111827",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
    },
});
