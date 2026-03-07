import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import styles from "./styles";
import { AppContext } from "../../context/app-context";
import { API_BASE_URL } from "@/src/config";
import { useRouter } from "expo-router";

type SensorType = "Lock" | "Motion" | "Camera" | "Contact";

type Sensor = {
    id: string;
    name: string;
    type: SensorType;
    status: "active" | "inactive";
    battery: number | null;
    location: string;
    lastUpdate: string;
};

const TYPE_ICONS: Record<SensorType, any> = {
    Lock: require("../../assets/images/lock.png"),
    Motion: require("../../assets/images/radar.png"),
    Camera: require("../../assets/images/camera.png"),
    Contact: require("../../assets/images/lock-open.png"),
};

const FETCH_TIMEOUT = 8000;

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function Sensors() {
    const { user, authToken, deviceId } = useContext(AppContext);
    const router = useRouter();
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const headers = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchSensors = useCallback(async () => {
        if (!deviceId || !authToken) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/sensors`, {
                headers: headers(),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error("Failed to load sensors");
            const data: Sensor[] = await res.json();
            setSensors(data);
        } catch (e: any) {
            setError(e.name === "AbortError" ? "Server unreachable" : (e.message || "Failed to load"));
        } finally {
            setLoading(false);
        }
    }, [authToken, deviceId, headers]);

    useEffect(() => {
        fetchSensors();
    }, [fetchSensors]);

    const toggleSensor = async (sensor: Sensor) => {
        const next = sensor.status === "active" ? "inactive" : "active";
        const prev = sensor.status;
        setSensors((s) => s.map((x) => (x.id === sensor.id ? { ...x, status: next } : x)));
        setTogglingId(sensor.id);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/sensors/${sensor.id}`, {
                method: "PATCH",
                headers: headers(),
                body: JSON.stringify({ status: next }),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error("Failed to update sensor");
            const updated: Sensor = await res.json();
            setSensors((s) => s.map((x) => (x.id === sensor.id ? updated : x)));
        } catch (e: any) {
            setSensors((s) => s.map((x) => (x.id === sensor.id ? { ...x, status: prev } : x)));
            setError(e.message || "Failed to update sensor");
        } finally {
            setTogglingId(null);
        }
    };

    const stats = useMemo(() => {
        const active = sensors.filter((s) => s.status === "active").length;
        const inactive = sensors.length - active;
        const lowBattery = sensors.filter((s) => typeof s.battery === "number" && s.battery < 50).length;
        return { active, inactive, lowBattery, total: sensors.length };
    }, [sensors]);

    if (!user) {
        return (
            <View style={[styles.screen, authStyles.container]}>
                <Text style={authStyles.title}>You are not logged in</Text>
                <Text style={authStyles.subtitle}>Log in from Settings to use the app.</Text>
                <TouchableOpacity onPress={() => router.push("/settings")} style={authStyles.button}>
                    <Text style={authStyles.buttonText}>Go to Settings</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sensors & Devices</Text>
                <Text style={styles.subtitle}>
                    {loading ? "Loading..." : `${stats.active} of ${stats.total} sensors active`}
                </Text>
            </View>

            {/* Error banner */}
            {error && !loading && (
                <View style={localStyles.errorBanner}>
                    <Text style={localStyles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchSensors}>
                        <Text style={localStyles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Loading state */}
            {loading ? (
                <View style={localStyles.centerBox}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={localStyles.loadingText}>Loading sensors...</Text>
                </View>
            ) : !error && sensors.length === 0 ? (
                /* Empty state */
                <View style={localStyles.centerBox}>
                    <Text style={localStyles.emptyTitle}>No sensors found</Text>
                    <Text style={localStyles.emptySubtitle}>No sensors are registered for this device.</Text>
                    <TouchableOpacity onPress={fetchSensors} style={localStyles.retryButton}>
                        <Text style={localStyles.retryButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* Sensor list */
                <View style={styles.list}>
                    {sensors.map((sensor) => {
                        const icon = TYPE_ICONS[sensor.type] ?? TYPE_ICONS.Contact;
                        const isToggling = togglingId === sensor.id;
                        const lastUpdateLabel =
                            sensor.type === "Camera" && sensor.status === "active"
                                ? "Live"
                                : timeAgo(sensor.lastUpdate);

                        return (
                            <View key={sensor.id} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={styles.iconTitle}>
                                        <View
                                            style={[
                                                styles.iconBadge,
                                                sensor.status === "active"
                                                    ? styles.iconBadgeActive
                                                    : styles.iconBadgeInactive,
                                            ]}
                                        >
                                            <Image source={icon} style={styles.icon} />
                                        </View>
                                        <View>
                                            <Text style={styles.cardTitle}>{sensor.name}</Text>
                                            <Text style={styles.cardLocation}>{sensor.location}</Text>
                                        </View>
                                    </View>
                                    {isToggling ? (
                                        <ActivityIndicator size="small" color="#2563eb" />
                                    ) : (
                                        <Switch
                                            value={sensor.status === "active"}
                                            onValueChange={() => toggleSensor(sensor)}
                                        />
                                    )}
                                </View>

                                <View style={styles.metaRow}>
                                    <Text style={styles.metaLabel}>Status</Text>
                                    <Text
                                        style={[
                                            styles.badge,
                                            sensor.status === "active" ? styles.badgeActive : styles.badgeMuted,
                                        ]}
                                    >
                                        {sensor.status === "active" ? "Active" : "Inactive"}
                                    </Text>
                                </View>

                                {sensor.battery !== null ? (
                                    <View style={styles.metaGroup}>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Battery</Text>
                                            <Text
                                                style={[
                                                    styles.metaValue,
                                                    sensor.battery < 50 && styles.destructiveText,
                                                ]}
                                            >
                                                {sensor.battery}%
                                            </Text>
                                        </View>
                                        <View style={styles.progressTrack}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { width: `${Math.min(sensor.battery, 100)}%` },
                                                    sensor.battery < 50 && styles.progressLow,
                                                ]}
                                            />
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>Power</Text>
                                        <Text style={[styles.badge, styles.badgeOutline]}>AC Powered</Text>
                                    </View>
                                )}

                                <View style={[styles.metaRow, styles.metaSpacing]}>
                                    <Text style={styles.metaLabel}>Last update</Text>
                                    <Text style={styles.metaValue}>{lastUpdateLabel}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Summary row */}
            {!loading && sensors.length > 0 && (
                <View style={styles.summary}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNumber}>{stats.active}</Text>
                        <Text style={styles.summaryLabel}>Active</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNumber}>{stats.inactive}</Text>
                        <Text style={styles.summaryLabel}>Inactive</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNumber}>{stats.lowBattery}</Text>
                        <Text style={styles.summaryLabel}>Low Battery</Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    centerBox: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
        gap: 10,
    },
    loadingText: {
        marginTop: 8,
        color: "#6b7280",
        fontSize: 14,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#111827",
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        paddingHorizontal: 24,
    },
    retryButton: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
        backgroundColor: "#111827",
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    errorBanner: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
    },
    errorText: {
        color: "#991b1b",
        fontSize: 13,
        flexShrink: 1,
        marginRight: 12,
    },
    retryText: {
        color: "#2563eb",
        fontWeight: "600",
        fontSize: 13,
    },
});

const authStyles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
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
