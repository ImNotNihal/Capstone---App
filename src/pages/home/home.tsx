import { API_BASE_URL } from "@/src/config";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { WebView } from "react-native-webview";
import { AppContext } from "../../context/app-context";


// --- Constants & Helpers ---
const EVENT_LABELS: Record<string, string> = {
    LOCKED: "Door locked",
    UNLOCKED: "Door unlocked",
    MOTION_DETECTED: "Motion detected at front door",
    FACE_RECOGNIZED: "Familiar face recognized",
    FACE_UNKNOWN: "Unrecognized person detected",
    FINGERPRINT_SUCCESS: "Unlocked via fingerprint",
    FINGERPRINT_FAILED: "Fingerprint not recognized",
    KEYPAD_SUCCESS: "Unlocked via keypad",
    KEYPAD_FAILED: "Incorrect PIN entered",
    DOOR_OPENED: "Door opened",
    DOOR_CLOSED: "Door closed",
    CAMERA_TRIGGERED: "Recording started",
    AUTH_FAILED: "Failed login attempt",
};

const EVENT_ICONS: Record<string, any> = {
    LOCKED: "lock",
    UNLOCKED: "lock-open-variant",
    MOTION_DETECTED: "walk",
    FACE_RECOGNIZED: "face-recognition",
    FINGERPRINT_SUCCESS: "fingerprint",
    KEYPAD_SUCCESS: "dialpad",
    DEFAULT: "history"
};

const METHOD_LABELS: Record<string, string> = {
    face: "Facial Recognition",
    fingerprint: "Fingerprint Scanner",
    keypad: "Keypad Entry",
    bluetooth: "Bluetooth Proximity",
};

const METHOD_ICONS: Record<string, string> = {
    face: "face-recognition",
    fingerprint: "fingerprint",
    keypad: "dialpad",
    bluetooth: "bluetooth",
};

const ALL_METHODS = ["face", "fingerprint", "keypad"] as const;

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function Home() {
    const { user, deviceId, httpLock, httpUnlock, isLocked, authToken } = useContext(AppContext);
    const router = useRouter();

    // --- Media Controls State ---
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Default feed audio to muted
    const [hasStream, setHasStream] = useState(false);

    // --- Hardware Mock State ---
    const [batteryLevel] = useState(85);

    // --- Animation Values ---
    const lockScale = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    // Trigger entrance animations on load
    useEffect(() => {
        if (user) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [user, fadeAnim, translateY]);

    // Data State
    const [lastEvent, setLastEvent] = useState<{ type: string; timestamp: string } | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [methodsState, setMethodsState] = useState<Record<string, boolean>>({ face: false, fingerprint: false, keypad: false });
    const [activeMethods, setActiveMethods] = useState<string[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(true);

    // --- Animated Interaction Handlers ---
    const handleLockToggle = () => {
        Animated.sequence([
            Animated.timing(lockScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
            Animated.timing(lockScale, { toValue: 1, duration: 150, useNativeDriver: true })
        ]).start();
        if (isLocked) { httpUnlock(); } else { httpLock(); }
    };

    const toggleCall = () => setIsCallActive((prev) => !prev);
    const toggleMute = () => setIsMuted((prev) => !prev);

    const authHeaders = useCallback(() => {
        const h: Record<string, string> = {};
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    // --- API Calls ---
    const fetchLastActivity = useCallback(async () => {
        if (!deviceId || !authToken) return;
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
        if (!authToken) return;
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
            const state: Record<string, boolean> = {};
            const active: string[] = [];
            for (const m of ALL_METHODS) {
                state[m] = methods[m]?.isActive ?? false;
                if (state[m]) active.push(m);
            }
            setMethodsState(state);
            setActiveMethods(active);
        } catch {
            setMethodsState({ face: false, fingerprint: false, keypad: false });
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

    if (!user) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />

            {/* COMPACT HEADER WITH HARDWARE STATUS */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Front Door</Text>
                
                <View style={styles.headerRight}>
                    <View style={styles.statusIcons}>
                        <MaterialCommunityIcons name="wifi" size={15} color="#71717A" style={styles.wifiIcon} />
                        <View style={styles.batteryContainer}>
                            <Text style={styles.batteryText}>{batteryLevel}%</Text>
                            <MaterialCommunityIcons name="battery-80" size={16} color="#71717A" />
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => router.push("/settings")}>
                        <MaterialCommunityIcons name="cog-outline" size={24} color="#A1A1AA" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* HERO CAMERA FEED */}
                <View style={styles.cameraHero}>
                    <CameraFeed onStreamChange={setHasStream} />

                    {/* LIVE dot — only shown when the camera stream is active */}
                    {hasStream && (
                        <View style={styles.liveOverlay}>
                            <PulseDot />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    )}

                    {/* CAMERA MEDIA CONTROLS */}
                    <View style={styles.cameraControls}>
                        {/* Speaker Toggle */}
                        <TouchableOpacity
                            style={[styles.overlayButton, !isMuted && styles.overlayButtonActive]}
                            onPress={toggleMute}
                        >
                            <MaterialCommunityIcons
                                name={isMuted ? "volume-off" : "volume-high"}
                                size={22}
                                color={!isMuted ? "#000" : "#fff"}
                            />
                        </TouchableOpacity>
                        
                        {/* Microphone Toggle */}
                        <TouchableOpacity
                            style={[styles.overlayButton, isCallActive && styles.overlayButtonActive]}
                            onPress={toggleCall}
                        >
                            <MaterialCommunityIcons
                                name={isCallActive ? "microphone" : "microphone-off"}
                                size={22}
                                color={isCallActive ? "#000" : "#fff"}
                            />
                        </TouchableOpacity>
                        
                        {/* Fullscreen Button */}
                        <TouchableOpacity style={styles.overlayButton}>
                            <MaterialCommunityIcons name="fullscreen" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ANIMATED ACTION SECTION */}
                <Animated.View style={[styles.actionSection, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <Animated.View style={{ transform: [{ scale: lockScale }] }}>
                        <TouchableOpacity 
                            style={[styles.sleekLockPill, isLocked ? styles.pillLocked : styles.pillUnlocked]} 
                            onPress={handleLockToggle}
                            activeOpacity={1}
                        >
                            <View style={[styles.pillIconBg, isLocked ? styles.pillIconBgLocked : styles.pillIconBgUnlocked]}>
                                <MaterialCommunityIcons 
                                    name={isLocked ? "lock" : "lock-open-variant"} 
                                    size={20} 
                                    color={isLocked ? "#10B981" : "#EF4444"} 
                                />
                            </View>
                            <Text style={styles.sleekLockText}>
                                {isLocked ? "Tap to Unlock" : "Tap to Lock"}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>

                {/* ANIMATED ACTIVITY LOG */}
                <Animated.View style={[styles.activitySection, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    
                    <View style={styles.activityCard}>
                        <View style={styles.activityIconWrapper}>
                            <MaterialCommunityIcons 
                                name={lastEvent ? (EVENT_ICONS[lastEvent.type] || EVENT_ICONS.DEFAULT) : "clock-outline"} 
                                size={22} 
                                color="#A1A1AA" 
                            />
                        </View>
                        <View style={styles.activityTextWrapper}>
                            <Text style={styles.activityTitle}>
                                {loadingEvent ? "Checking logs..." : lastEvent ? (EVENT_LABELS[lastEvent.type] ?? lastEvent.type) : "No recent activity"}
                            </Text>
                            {lastEvent && <Text style={styles.activityTime}>{timeAgo(lastEvent.timestamp)}</Text>}
                        </View>
                    </View>

                    {/* Access Methods — individual cards */}
                    <Text style={styles.sectionTitle}>Access Methods</Text>
                    <View style={styles.methodsGrid}>
                        {ALL_METHODS.map((method) => {
                            const enabled = methodsState[method] ?? false;
                            return (
                                <View key={method} style={styles.methodCard}>
                                    <View style={[styles.methodIconWrapper, { backgroundColor: enabled ? "#10B98115" : "#EF444415" }]}>
                                        <MaterialCommunityIcons
                                            name={METHOD_ICONS[method] as any}
                                            size={22}
                                            color={enabled ? "#10B981" : "#EF4444"}
                                        />
                                    </View>
                                    <Text style={styles.methodLabel} numberOfLines={1}>
                                        {METHOD_LABELS[method]}
                                    </Text>
                                    <View style={styles.methodStatusRow}>
                                        <View style={[styles.statusDot, { backgroundColor: enabled ? "#10B981" : "#EF4444" }]} />
                                        <Text style={[styles.methodStatus, { color: enabled ? "#10B981" : "#EF4444" }]}>
                                            {loadingMethods ? "…" : enabled ? "Enabled" : "Disabled"}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <Text style={styles.sectionTitle}>Active Access Methods</Text>
                    
                    <View style={styles.activityCard}>
                        <View style={styles.activityIconWrapper}>
                            <MaterialCommunityIcons name="shield-check-outline" size={22} color="#A1A1AA" />
                        </View>
                        <View style={styles.activityTextWrapper}>
                            <Text style={styles.activityTitle}>
                                {loadingMethods 
                                    ? "Loading..." 
                                    : activeMethods.length > 0 
                                        ? activeMethods.map(m => METHOD_LABELS[m] || m).join(", ") 
                                        : "None configured"}
                            </Text>
                            <Text style={styles.activityTime}>Manage in Settings</Text>
                        </View>
                    </View>
                </Animated.View>

            </ScrollView>
        </SafeAreaView>
    );
}

/* --- Pulsing Animation Component --- */
const PulseDot = () => {
    const opacityAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0.4, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, [opacityAnim]);

    return <Animated.View style={[styles.liveDot, { opacity: opacityAnim }]} />;
};

/* --- Camera Feed Sub-Component --- */
const CameraFeed = ({ onStreamChange }: { onStreamChange?: (v: boolean) => void }) => {
    const { cameraBaseUrl, isWebBrowser, authToken } = useContext(AppContext);
    const [source, setSource] = useState("");
    const [webViewKey, setWebViewKey] = useState(0);

    useFocusEffect(
        useCallback(() => {
            if (cameraBaseUrl) {
                const url = `${cameraBaseUrl}/stream?ts=${Date.now()}`;
                setSource(url);
                setWebViewKey((prev) => prev + 1);
                if (onStreamChange) onStreamChange(true);
            } else {
                setSource("");
                if (onStreamChange) onStreamChange(false);
            }
            return () => {
                setSource("");
                if (onStreamChange) onStreamChange(false);
            };
        }, [cameraBaseUrl, onStreamChange])
    );

    return (
        <View style={StyleSheet.absoluteFillObject}>
            {source ? (
                isWebBrowser ? (
                    <img
                        src={source}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        alt="Live Feed"
                    />
                ) : (
                    <WebView
                        key={webViewKey}
                        source={{
                            uri: source,
                            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                        }}
                        style={{ flex: 1, backgroundColor: '#050505' }}
                        scrollEnabled={false}
                        onError={() => { if(onStreamChange) onStreamChange(false); }}
                    />
                )
            ) : (
                <View style={styles.videoPlaceholder}>
                    <MaterialCommunityIcons name="video-off-outline" size={36} color="#3F3F46" />
                    <Text style={styles.videoText}>Camera sleeping</Text>
                    <Text style={styles.videoSubText}>Waiting for motion</Text>
                </View>
            )}
        </View>
    );
};

/* --- Styles --- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    authContainer: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        color: '#FAFAFA',
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 14,
    },
    wifiIcon: {
        marginRight: 8,
    },
    batteryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    batteryText: {
        color: '#71717A',
        fontSize: 11,
        fontWeight: '600',
        marginRight: 2,
    },
    cameraHero: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#09090B',
        position: 'relative',
        borderBottomWidth: 1,
        borderColor: '#18181B',
    },
    videoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoText: {
        color: '#A1A1AA',
        marginTop: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    videoSubText: {
        color: '#52525B',
        fontSize: 12,
        marginTop: 2,
    },
    liveOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginRight: 6,
    },
    liveText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        gap: 10,
    },
    overlayButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayButtonActive: {
        backgroundColor: '#fff',
    },
    actionSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    sleekLockPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 30,
        borderWidth: 1,
        width: 220,
    },
    pillLocked: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    pillUnlocked: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    pillIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    pillIconBgLocked: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    pillIconBgUnlocked: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    sleekLockText: {
        color: '#FAFAFA',
        fontSize: 16,
        fontWeight: '600',
    },
    activitySection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        color: '#71717A',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#09090B',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#18181B',
    },
    activityIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#18181B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    activityTextWrapper: {
        flex: 1,
    },
    activityTitle: {
        color: '#E4E4E7',
        fontSize: 15,
        fontWeight: '500',
    },
    activityTime: {
        color: '#A1A1AA',
        fontSize: 12,
        marginTop: 4,
    },
    methodsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    methodCard: {
        flex: 1,
        backgroundColor: '#09090B',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#18181B',
        alignItems: 'flex-start',
        gap: 8,
    },
    methodIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodLabel: {
        color: '#FAFAFA',
        fontSize: 12,
        fontWeight: '600',
    },
    methodStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    methodStatus: {
        fontWeight: '500',
        fontSize: 13,
        marginTop: 4,
    },
});