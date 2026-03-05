import React, { useContext, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";
import { AppContext } from "../../context/app-context";
import { useRouter } from "expo-router";
type EventCategory = "access" | "motion" | "alert";

type EventItem = {
    id: string;
    category: EventCategory;
    title: string;
    description: string;
    timestamp: string;
    icon: any;
    tint: string;
};

const filterOptions: { label: string; value: "all" | EventCategory }[] = [
    { label: "All", value: "all" },
    { label: "Access", value: "access" },
    { label: "Motion", value: "motion" },
    { label: "Alerts", value: "alert" },
];

const eventItems: EventItem[] = [
    {
        id: "1",
        category: "access",
        title: "Door Unlocked",
        description: "John Doe - Face Recognition",
        timestamp: "2 minutes ago",
        icon: require("../../assets/images/lock-open.png"),
        tint: "#16a34a",
    },
    {
        id: "2",
        category: "motion",
        title: "Motion Detected",
        description: "Front door camera",
        timestamp: "5 minutes ago",
        icon: require("../../assets/images/camera.png"),
        tint: "#2563eb",
    },
    {
        id: "3",
        category: "access",
        title: "Doorbell Pressed",
        description: "Visitor at front door",
        timestamp: "12 minutes ago",
        icon: require("../../assets/images/bell.png"),
        tint: "#f97316",
    },
    {
        id: "4",
        category: "access",
        title: "Door Locked",
        description: "Remote lock via app",
        timestamp: "1 hour ago",
        icon: require("../../assets/images/lock.png"),
        tint: "#dc2626",
    },
    {
        id: "5",
        category: "motion",
        title: "Window Sensor Triggered",
        description: "Living room window opened",
        timestamp: "2 hours ago",
        icon: require("../../assets/images/radar.png"),
        tint: "#facc15",
    },
    {
        id: "6",
        category: "access",
        title: "Door Unlocked",
        description: "Sarah Miller - Bluetooth",
        timestamp: "3 hours ago",
        icon: require("../../assets/images/lock-open.png"),
        tint: "#16a34a",
    },
    {
        id: "7",
        category: "alert",
        title: "Failed Access Attempt",
        description: "Unknown face detected",
        timestamp: "5 hours ago",
        icon: require("../../assets/images/bell.png"),
        tint: "#ef4444",
    },
    {
        id: "8",
        category: "access",
        title: "Door Unlocked",
        description: "John Doe - PIN Code",
        timestamp: "8 hours ago",
        icon: require("../../assets/images/lock-open.png"),
        tint: "#16a34a",
    },
];

export default function Events() {
    const [selectedFilter, setSelectedFilter] = useState<"all" | EventCategory>("all");
    const { user } = useContext(AppContext);
    const router = useRouter();

    const filteredEvents = useMemo(
        () => (selectedFilter === "all" ? eventItems : eventItems.filter((evt) => evt.category === selectedFilter)),
        [selectedFilter],
    );

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
        <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Activity Log</Text>
                <Text style={styles.subtitle}>Track all security events</Text>
            </View>

            <View style={styles.filters}>
                {filterOptions.map((option) => {
                    const isActive = selectedFilter === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setSelectedFilter(option.value)}
                            style={[styles.filterPill, isActive ? styles.filterPillActive : styles.filterPillInactive]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                        >
                            <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.list}>
                {filteredEvents.map((event) => (
                    <View key={event.id} style={styles.card}>
                        <View style={styles.cardIconWrapper}>
                            <View style={[styles.iconBadge, { backgroundColor: `${event.tint}1a` }]}>
                                <Image source={event.icon} style={[styles.cardIcon, { tintColor: event.tint }]} />
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{event.title}</Text>
                                {event.category === "alert" && (
                                    <View style={styles.alertBadge}>
                                        <Text style={styles.alertText}>Alert</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.cardDescription}>{event.description}</Text>
                            <Text style={styles.cardTimestamp}>{event.timestamp}</Text>
                        </View>
                    </View>
                ))}

                {!filteredEvents.length && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No events yet</Text>
                        <Text style={styles.emptySubtitle}>Try another filter or check back later.</Text>
                    </View>
                )}
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
