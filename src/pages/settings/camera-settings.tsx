import React, { useContext, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";
import { AppContext } from "@/src/context/app-context";

type Resolution = "480p" | "720p" | "1080p";
type RecordingMode = "continuous" | "motion" | "off";

export default function CameraSettings() {
    const { deviceId, isDeviceConnected } = useContext(AppContext);
    const [resolution, setResolution] = useState<Resolution>("720p");
    const [recordingMode, setRecordingMode] = useState<RecordingMode>("motion");
    const [audioEnabled, setAudioEnabled] = useState(false);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Camera Settings</Text>
                <Text style={styles.subtitle}>Configure video quality and recording</Text>
            </View>

            {/* Stream status */}
            <View style={[styles.card, styles.systemInfo]}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Camera Status</Text>
                    <Text style={[localStyles.statusBadge, isDeviceConnected ? localStyles.statusOnline : localStyles.statusOffline]}>
                        {isDeviceConnected ? "Streaming" : "Offline"}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Stream URL</Text>
                    <Text style={styles.infoValue}>/camera/{deviceId}/stream</Text>
                </View>
            </View>

            {/* Video Quality */}
            <View>
                <Text style={styles.sectionTitle}>Video Quality</Text>
                <View style={styles.card}>
                    <Text style={[styles.rowTitle, { marginBottom: 8 }]}>Resolution</Text>
                    <View style={localStyles.optionsRow}>
                        {(["480p", "720p", "1080p"] as Resolution[]).map((res) => (
                            <TouchableOpacity
                                key={res}
                                onPress={() => setResolution(res)}
                                style={[
                                    localStyles.optionChip,
                                    resolution === res && localStyles.optionChipActive,
                                ]}
                            >
                                <Text style={[
                                    localStyles.optionChipText,
                                    resolution === res && localStyles.optionChipTextActive,
                                ]}>
                                    {res}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.rowSubtitle, { marginTop: 8 }]}>
                        {resolution === "480p" && "Lower quality, less bandwidth usage"}
                        {resolution === "720p" && "Balanced quality and performance"}
                        {resolution === "1080p" && "Best quality, higher bandwidth usage"}
                    </Text>
                </View>
            </View>

            {/* Recording Mode */}
            <View>
                <Text style={styles.sectionTitle}>Recording</Text>
                <View style={styles.card}>
                    <Text style={[styles.rowTitle, { marginBottom: 8 }]}>Recording Mode</Text>
                    <View style={localStyles.optionsRow}>
                        {([
                            { key: "continuous", label: "Continuous" },
                            { key: "motion", label: "Motion Only" },
                            { key: "off", label: "Off" },
                        ] as { key: RecordingMode; label: string }[]).map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setRecordingMode(key)}
                                style={[
                                    localStyles.optionChip,
                                    recordingMode === key && localStyles.optionChipActive,
                                ]}
                            >
                                <Text style={[
                                    localStyles.optionChipText,
                                    recordingMode === key && localStyles.optionChipTextActive,
                                ]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.rowSubtitle, { marginTop: 8 }]}>
                        {recordingMode === "continuous" && "Records 24/7 — uses more storage"}
                        {recordingMode === "motion" && "Records only when motion is detected"}
                        {recordingMode === "off" && "Live view only, no recordings saved"}
                    </Text>
                </View>
            </View>

            {/* Features */}
            <View>
                <Text style={styles.sectionTitle}>Features</Text>
                <View style={[styles.card, styles.divide]}>
                    <View style={styles.settingToggleRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}>
                            <View style={[styles.circleIcon, { backgroundColor: "#2563eb1a" }]}>
                                <Text style={[styles.circleIconText, { color: "#2563eb" }]}>A</Text>
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={styles.rowTitle}>Audio Recording</Text>
                                <Text style={styles.rowSubtitle}>Capture audio with video</Text>
                            </View>
                        </View>
                        <Switch value={audioEnabled} onValueChange={setAudioEnabled} />
                    </View>
                    <View style={styles.settingToggleRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}>
                            <View style={[styles.circleIcon, { backgroundColor: "#22c55e1a" }]}>
                                <Text style={[styles.circleIconText, { color: "#22c55e" }]}>T</Text>
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={styles.rowTitle}>Timestamp Overlay</Text>
                                <Text style={styles.rowSubtitle}>Date and time always shown on footage</Text>
                            </View>
                        </View>
                        <Text style={localStyles.alwaysOnBadge}>Always On</Text>
                    </View>
                </View>
            </View>

            {/* Camera info */}
            <View style={[styles.card, styles.systemInfo]}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Device ID</Text>
                    <Text style={styles.infoValue}>{deviceId || "—"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Feed Type</Text>
                    <Text style={styles.infoValue}>MJPEG Stream</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const localStyles = {
    statusBadge: {
        fontSize: 12,
        fontWeight: "700" as const,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: "hidden" as const,
    },
    statusOnline: {
        backgroundColor: "#dcfce7",
        color: "#166534",
    },
    statusOffline: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
    },
    optionsRow: {
        flexDirection: "row" as const,
        gap: 8,
    },
    optionChip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        alignItems: "center" as const,
    },
    optionChipActive: {
        backgroundColor: "#2563eb",
        borderColor: "#2563eb",
    },
    optionChipText: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: "#374151",
    },
    optionChipTextActive: {
        color: "#fff",
    },
    alwaysOnBadge: {
        fontSize: 12,
        fontWeight: "700" as const,
        color: "#166534",
        backgroundColor: "#dcfce7",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: "hidden" as const,
    },
};
