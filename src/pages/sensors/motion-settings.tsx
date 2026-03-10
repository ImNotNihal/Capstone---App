import { API_BASE_URL } from "@/src/config";
import { AppContext } from "@/src/context/app-context";
import { useTheme } from "@/src/context/theme-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function MotionSettings() {
    const router = useRouter();
    const { authToken, deviceId } = useContext(AppContext);
    const { colors, isDark } = useTheme();
    
    const [isEnabled, setIsEnabled] = useState(true);
    const [sensitivity, setSensitivity] = useState<"low" | "medium" | "high">("medium");
    const [activeZones, setActiveZones] = useState([true, true, false, true]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const authHeaders = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchSettings = useCallback(async () => {
        if (!deviceId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}settings/${deviceId}`, {
                headers: authHeaders(),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.motionSensitivity) setSensitivity(data.motionSensitivity);
            if (typeof data.motionEnabled === "boolean") setIsEnabled(data.motionEnabled);
            if (Array.isArray(data.activeZones) && data.activeZones.length === 4) setActiveZones(data.activeZones);
        } catch {} finally {
            setLoading(false);
        }
    }, [authToken, deviceId, authHeaders]);

    useFocusEffect(
        useCallback(() => {
            fetchSettings();
        }, [fetchSettings])
    );

    const toggleZone = (index: number) => {
        const newZones = [...activeZones];
        newZones[index] = !newZones[index];
        setActiveZones(newZones);
    };

    const handleSave = async () => {
        if (!deviceId) {
            Alert.alert("Not connected", "Please make sure a device is linked to your account.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}settings/${deviceId}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({
                    motionEnabled: isEnabled,
                    motionSensitivity: sensitivity,
                    activeZones: activeZones,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.detail ?? `Server error ${res.status}`);
            }
            router.back();
        } catch (e: any) {
            Alert.alert("Save failed", e.message ?? "Could not save motion settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* HEADER */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Motion Setup</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator color={colors.text} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* SENSITIVITY DEMO VISUALIZER */}
                    <SensitivityVisualizer sensitivity={sensitivity} isEnabled={isEnabled} colors={colors} />

                    {/* CAMERA FEED & ZONE SELECTOR */}
                    <View style={styles.feedWrapper}>
                        <ImageBackground
                            source={require("../../assets/images/camera-feed-test.png")}
                            style={styles.cameraFeed}
                            imageStyle={{ borderRadius: 24 }}
                        >
                            <View style={styles.zoneOverlay}>
                                {activeZones.map((active, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => toggleZone(i)}
                                        style={[styles.zoneBox, active ? styles.zoneBoxActive : styles.zoneBoxInactive]}
                                    >
                                        <View style={[styles.zoneLabel, { backgroundColor: active ? "#8B5CF6" : "#27272A" }]}>
                                            <Text style={styles.zoneLabelText}>Zone {i + 1}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE FEED</Text>
                            </View>
                        </ImageBackground>
                    </View>

                    {/* MAIN CONTROLS */}
                    <View style={[styles.controlsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                        <View style={styles.settingRow}>
                            <View>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>Enable Detection</Text>
                                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>Monitor movement in active zones</Text>
                            </View>
                            <Switch
                                value={isEnabled}
                                onValueChange={setIsEnabled}
                                trackColor={{ false: "#27272A", true: "#8B5CF650" }}
                                thumbColor={isEnabled ? "#8B5CF6" : "#71717A"}
                            />
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {/* SENSITIVITY SELECTOR */}
                        <View style={styles.sliderSection}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Sensitivity</Text>
                            <View style={[styles.segmentRow, { borderColor: colors.borderLight }]}>
                                {(["low", "medium", "high"] as const).map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[styles.segment, { backgroundColor: colors.bgSubtle }, sensitivity === level && styles.segmentActive]}
                                        onPress={() => setSensitivity(level)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.segmentText, { color: colors.textTertiary }, sensitivity === level && styles.segmentTextActive]}>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <MaterialCommunityIcons name="information-outline" size={20} color="#8B5CF6" />
                        <Text style={styles.infoText}>
                            Tap boxes on the camera feed above to toggle motion detection zones. Changes are saved when you apply the configuration.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        {saving ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <ActivityIndicator color="#050505" />
                                <Text style={styles.saveButtonText}>Saving…</Text>
                            </View>
                        ) : (
                            <Text style={styles.saveButtonText}>Apply Configuration</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

/* Animated sensitivity visualizer */
const SENSITIVITY_BARS = { low: 3, medium: 6, high: 10 };
const SENSITIVITY_COLOR = { low: "#10B981", medium: "#F59E0B", high: "#EF4444" };

function SensitivityVisualizer({
    sensitivity,
    isEnabled,
    colors,
}: {
    sensitivity: "low" | "medium" | "high";
    isEnabled: boolean;
    colors: any;
}) {
    const barCount = SENSITIVITY_BARS[sensitivity];
    const barColor = isEnabled ? SENSITIVITY_COLOR[sensitivity] : "#27272A";
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        if (!isEnabled) {
            pulseAnim.setValue(0.4);
            return;
        }
        const speed = sensitivity === "high" ? 400 : sensitivity === "medium" ? 700 : 1100;
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: speed, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.4, duration: speed, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [sensitivity, isEnabled, pulseAnim]);

    return (
        <View style={[vizStyles.container, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={vizStyles.labelRow}>
                <MaterialCommunityIcons name="motion-sensor" size={18} color={barColor} />
                <Text style={[vizStyles.label, { color: colors.text }]}>Motion Sensitivity Preview</Text>
                <View style={[vizStyles.badge, { backgroundColor: `${barColor}20` }]}>
                    <Text style={[vizStyles.badgeText, { color: barColor }]}>
                        {isEnabled ? sensitivity.toUpperCase() : "OFF"}
                    </Text>
                </View>
            </View>

            {/* Animated radar-style bars */}
            <View style={vizStyles.barsRow}>
                {Array.from({ length: 10 }).map((_, i) => {
                    const isActive = i < barCount && isEnabled;
                    const height = 8 + i * 3;
                    return (
                        <Animated.View
                            key={i}
                            style={[
                                vizStyles.bar,
                                {
                                    height,
                                    backgroundColor: isActive ? barColor : colors.bgSubtle,
                                    opacity: isActive ? pulseAnim : 1,
                                },
                            ]}
                        />
                    );
                })}
            </View>

            <Text style={[vizStyles.hint, { color: colors.textTertiary }]}>
                {isEnabled
                    ? sensitivity === "high"
                        ? "High sensitivity — detects minor movements"
                        : sensitivity === "medium"
                        ? "Medium sensitivity — balanced detection"
                        : "Low sensitivity — only large movements trigger alerts"
                    : "Motion detection is disabled"}
            </Text>
        </View>
    );
}

const vizStyles = StyleSheet.create({
    container: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
        gap: 12,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    label: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    barsRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 5,
        height: 40,
    },
    bar: {
        flex: 1,
        borderRadius: 4,
    },
    hint: {
        fontSize: 12,
        lineHeight: 16,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#050505",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 16,
    },
    backButton: { 
        padding: 8 
    },
    headerTitle: { 
        color: "#FAFAFA", 
        fontSize: 18, 
        fontWeight: "bold" 
    },
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingBottom: 40 
    },
    feedWrapper: { 
        width: '100%', 
        aspectRatio: 16 / 10, 
        marginBottom: 24 
    },
    cameraFeed: { 
        flex: 1, 
        overflow: 'hidden' 
    },
    zoneOverlay: { 
        flex: 1, 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        padding: 10, 
        gap: 10 
    },
    zoneBox: { 
        width: '48%', 
        height: '46%', 
        borderRadius: 12, 
        borderWidth: 2, 
        borderStyle: 'dashed', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    zoneBoxActive: { 
        borderColor: '#8B5CF6', 
        backgroundColor: 'rgba(139, 92, 246, 0.15)' 
    },
    zoneBoxInactive: { 
        borderColor: 'rgba(255, 255, 255, 0.2)', 
        backgroundColor: 'rgba(0, 0, 0, 0.4)' 
    },
    zoneLabel: { 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6 
    },
    zoneLabelText: { 
        color: '#FAFAFA', 
        fontSize: 10, 
        fontWeight: 'bold' 
    },
    liveBadge: { 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 12, 
        gap: 6 
    },
    liveDot: { 
        width: 6, 
        height: 6, 
        borderRadius: 3, 
        backgroundColor: '#EF4444' 
    },
    liveText: { 
        color: '#FAFAFA', 
        fontSize: 10, 
        fontWeight: 'bold' 
    },
    controlsCard: { 
        backgroundColor: "#09090B", 
        borderRadius: 24, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: "#18181B" 
    },
    settingRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    settingTitle: { 
        color: "#FAFAFA", 
        fontSize: 16, 
        fontWeight: "bold" 
    },
    settingDesc: { 
        color: "#71717A", 
        fontSize: 13, 
        marginTop: 2 
    },
    divider: { 
        height: 1, 
        backgroundColor: '#18181B', 
        marginVertical: 20 
    },
    sliderSection: { 
        width: '100%' 
    },
    segmentRow: { 
        flexDirection: 'row', 
        marginTop: 12, 
        borderRadius: 12, 
        overflow: 'hidden', 
        borderWidth: 1, 
        borderColor: '#27272A' 
    },
    segment: { 
        flex: 1, 
        paddingVertical: 10, 
        alignItems: 'center', 
        backgroundColor: '#0A0A0A' 
    },
    segmentActive: { 
        backgroundColor: '#8B5CF6' 
    },
    segmentText: { 
        color: '#71717A', 
        fontSize: 13, 
        fontWeight: '600' 
    },
    segmentTextActive: { 
        color: '#FAFAFA' 
    },
    infoBox: { 
        flexDirection: 'row', 
        backgroundColor: '#8B5CF610', 
        padding: 16, 
        borderRadius: 16, 
        marginTop: 20, 
        gap: 12, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#8B5CF620' 
    },
    infoText: { 
        color: '#A78BFA', 
        fontSize: 13, 
        flex: 1, 
        lineHeight: 18 
    },
    saveButton: { 
        backgroundColor: '#FAFAFA', 
        height: 56, 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 32 
    },
    saveButtonText: { 
        color: '#050505', 
        fontSize: 16, 
        fontWeight: 'bold' 
    }
});