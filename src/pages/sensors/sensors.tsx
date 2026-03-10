import { API_BASE_URL } from "@/src/config";
import { AppContext } from "@/src/context/app-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 52) / 2;

export default function Sensors() {
    const router = useRouter();
    const { isLocked, httpLock, httpUnlock, authToken, deviceId } = useContext(AppContext);
    const [motionEnabled, setMotionEnabled] = useState(true);
    const [loadingMotion, setLoadingMotion] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const authHeaders = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchSettings = useCallback(async () => {
        if (!deviceId) return;
        try {
            const res = await fetch(`${API_BASE_URL}settings/${deviceId}`, {
                headers: authHeaders(),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (typeof data.cameraEnabled === "boolean") {
                setMotionEnabled(data.cameraEnabled);
            }
        } catch {}
    }, [authToken, deviceId, authHeaders]);

    useFocusEffect(
        useCallback(() => {
            fetchSettings();
        }, [fetchSettings])
    );

    const handleLockToggle = () => {
        if (isLocked) {
            httpUnlock();
        } else {
            httpLock();
        }
    };

    const handleMotionToggle = async (val: boolean) => {
        setMotionEnabled(val);
        setLoadingMotion(true);
        try {
            await fetch(`${API_BASE_URL}settings/${deviceId}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ cameraEnabled: val }),
            });
        } catch {
            setMotionEnabled(!val);
        } finally {
            setLoadingMotion(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Access Control</Text>
            </View>

            <View style={styles.ghostContainer} />

            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* PRIMARY STATUS: FRONT DOOR */}
                <TouchableOpacity
                    style={[styles.mainCard, !isLocked && styles.mainCardUnlocked]}
                    onPress={handleLockToggle}
                    activeOpacity={0.9}
                >
                    <View style={styles.mainCardHeader}>
                        <View style={[styles.mainIconWrapper, { backgroundColor: isLocked ? "#10B98120" : "#EF444420" }]}>
                            <MaterialCommunityIcons
                                name={isLocked ? "lock" : "lock-open"}
                                size={32}
                                color={isLocked ? "#10B981" : "#EF4444"}
                            />
                        </View>
                        <View style={styles.batteryBadge}>
                            <MaterialCommunityIcons name="battery" size={14} color="#71717A" />
                            <Text style={styles.batteryText}>92%</Text>
                        </View>
                    </View>
                    <View style={styles.mainCardBody}>
                        <Text style={styles.mainCardTitle}>Front Door</Text>
                        <Text style={styles.mainCardStatus}>
                            Current State: <Text style={{ color: isLocked ? "#10B981" : "#EF4444" }}>{isLocked ? "Locked" : "Unlocked"}</Text>
                        </Text>
                    </View>
                    <View style={styles.mainCardFooter}>
                        <Text style={styles.tapHint}>Tap to {isLocked ? "Unlock" : "Lock"}</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Configuration</Text>

                <View style={styles.grid}>
                    {/* Motion Detection */}
                    <TouchableOpacity
                        style={styles.configCard}
                        onPress={() => router.push("/sensors/motion-settings")}
                        activeOpacity={0.7}
                    >
                        <View style={styles.configHeader}>
                            <MaterialCommunityIcons name="run-fast" size={24} color="#8B5CF6" />
                            <Switch
                                value={motionEnabled}
                                onValueChange={handleMotionToggle}
                                disabled={loadingMotion}
                                trackColor={{ false: "#27272A", true: "#8B5CF650" }}
                                thumbColor={motionEnabled ? "#8B5CF6" : "#71717A"}
                            />
                        </View>
                        <View>
                            <Text style={styles.configTitle}>Motion</Text>
                            <Text style={styles.configDesc}>Setup zones</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#27272A" style={styles.cardArrow} />
                    </TouchableOpacity>

                    {/* PIN Configuration */}
                    <TouchableOpacity
                        style={styles.configCard}
                        activeOpacity={0.7}
                        onPress={() => router.push("/sensors/pin-settings")}
                    >
                        <MaterialCommunityIcons name="dialpad" size={24} color="#F59E0B" />
                        <View>
                            <Text style={styles.configTitle}>PIN Codes</Text>
                            <Text style={styles.configDesc}>Access keys</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#27272A" style={styles.cardArrow} />
                    </TouchableOpacity>

                    {/* Facial Recognition */}
                    <TouchableOpacity
                        style={styles.configCard}
                        activeOpacity={0.7}
                        onPress={() => router.push("/sensors/facial-settings")}
                    >
                        <MaterialCommunityIcons name="face-recognition" size={24} color="#3B82F6" />
                        <View>
                            <Text style={styles.configTitle}>Face ID</Text>
                            <Text style={styles.configDesc}>Profiles</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#27272A" style={styles.cardArrow} />
                    </TouchableOpacity>

                    {/* Fingerprint Configuration */}
                    <TouchableOpacity
                        style={styles.configCard}
                        activeOpacity={0.7}
                        onPress={() => router.push("/sensors/biometric-settings")}
                    >
                        <MaterialCommunityIcons name="fingerprint" size={24} color="#10B981" />
                        <View>
                            <Text style={styles.configTitle}>Biometrics</Text>
                            <Text style={styles.configDesc}>Scanner</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#27272A" style={styles.cardArrow} />
                    </TouchableOpacity>
                </View>

            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#050505",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        color: "#FAFAFA",
        fontSize: 28,
        fontWeight: "700",
    },
    ghostContainer: {
        height: 10,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionLabel: {
        color: "#71717A",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 32,
        marginBottom: 16,
    },
    mainCard: {
        backgroundColor: "#09090B",
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: "#18181B",
    },
    mainCardUnlocked: {
        borderColor: "#EF444440",
    },
    mainCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    mainIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    batteryBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#18181B",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    batteryText: {
        color: "#A1A1AA",
        fontSize: 12,
        fontWeight: "600",
    },
    mainCardBody: {
        marginTop: 20,
    },
    mainCardTitle: {
        color: "#FAFAFA",
        fontSize: 24,
        fontWeight: "bold",
    },
    mainCardStatus: {
        color: "#71717A",
        fontSize: 16,
        marginTop: 4,
    },
    mainCardFooter: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#18181B",
    },
    tapHint: {
        color: "#A1A1AA",
        fontSize: 13,
        textAlign: "center",
        fontWeight: "500",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    configCard: {
        width: COLUMN_WIDTH,
        backgroundColor: "#09090B",
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: "#18181B",
        minHeight: 140,
        justifyContent: "space-between",
    },
    configHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    configTitle: {
        color: "#FAFAFA",
        fontSize: 15,
        fontWeight: "bold",
        marginTop: 12,
    },
    configDesc: {
        color: "#71717A",
        fontSize: 12,
        marginTop: 4,
    },
    cardArrow: {
        position: "absolute",
        bottom: 16,
        right: 16,
    },
});