import React, { useContext, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";
import { AppContext } from "../../context/app-context";
import { useRouter } from "expo-router";
type SensorStatus = "active" | "inactive";
type SensorType = "Lock" | "Motion" | "Camera" | "Contact";

type Sensor = {
    id: string;
    name: string;
    type: SensorType;
    status: SensorStatus;
    battery: number | null;
    location: string;
    lastUpdate: string;
    icon: any;
};

const sensorsSeed: Sensor[] = [
    {
        id: "1",
        name: "Front Door Lock",
        type: "Lock",
        status: "active",
        battery: 85,
        icon: require("../../assets/images/lock.png"),
        location: "Main entrance",
        lastUpdate: "2 min ago",
    },
    {
        id: "2",
        name: "Motion Sensor",
        type: "Motion",
        status: "active",
        battery: 92,
        icon: require("../../assets/images/radar.png"),
        location: "Front porch",
        lastUpdate: "5 min ago",
    },
    {
        id: "3",
        name: "Door Camera",
        type: "Camera",
        status: "active",
        battery: null,
        icon: require("../../assets/images/camera.png"),
        location: "Above door",
        lastUpdate: "Live",
    },
    {
        id: "4",
        name: "Living Room Window",
        type: "Contact",
        status: "active",
        battery: 78,
        icon: require("../../assets/images/lock-open.png"),
        location: "Living room",
        lastUpdate: "2 hours ago",
    },
    {
        id: "5",
        name: "Back Door Sensor",
        type: "Contact",
        status: "inactive",
        battery: 45,
        icon: require("../../assets/images/lock-open.png"),
        location: "Back entrance",
        lastUpdate: "1 day ago",
    },
    {
        id: "6",
        name: "Garage Motion",
        type: "Motion",
        status: "active",
        battery: 65,
        icon: require("../../assets/images/radar.png"),
        location: "Garage",
        lastUpdate: "30 min ago",
    },
];

export default function Sensors() {
    const { user } = useContext(AppContext);
    const router = useRouter();
    const [sensors, setSensors] = useState<Sensor[]>(sensorsSeed);

    const stats = useMemo(() => {
        const active = sensors.filter((s) => s.status === "active").length;
        const inactive = sensors.length - active;
        const lowBattery = sensors.filter((s) => typeof s.battery === "number" && s.battery < 50).length;
        return { active, inactive, lowBattery, total: sensors.length };
    }, [sensors]);

    const toggleSensor = (id: string) => {
        setSensors((prev) =>
            prev.map((sensor) =>
                sensor.id === id ? { ...sensor, status: sensor.status === "active" ? "inactive" : "active" } : sensor,
            ),
        );
    };

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
                    {stats.active} of {stats.total} sensors active
                </Text>
            </View>

            <View style={styles.list}>
                {sensors.map((sensor) => (
                    <View key={sensor.id} style={styles.card}>
                        <View style={styles.cardTop}>
                            <View style={styles.iconTitle}>
                                <View
                                    style={[
                                        styles.iconBadge,
                                        sensor.status === "active" ? styles.iconBadgeActive : styles.iconBadgeInactive,
                                    ]}
                                >
                                    <Image source={sensor.icon} style={styles.icon} />
                                </View>
                                <View>
                                    <Text style={styles.cardTitle}>{sensor.name}</Text>
                                    <Text style={styles.cardLocation}>{sensor.location}</Text>
                                </View>
                            </View>
                            <Switch value={sensor.status === "active"} onValueChange={() => toggleSensor(sensor.id)} />
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Status</Text>
                            <Text style={[styles.badge, sensor.status === "active" ? styles.badgeActive : styles.badgeMuted]}>
                                {sensor.status === "active" ? "Active" : "Inactive"}
                            </Text>
                        </View>

                        {sensor.battery !== null ? (
                            <View style={styles.metaGroup}>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaLabel}>Battery</Text>
                                    <Text style={[styles.metaValue, sensor.battery < 50 && styles.destructiveText]}>
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
                            <Text style={styles.metaValue}>{sensor.lastUpdate}</Text>
                        </View>
                    </View>
                ))}
            </View>

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
        </ScrollView>
    );
}

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
