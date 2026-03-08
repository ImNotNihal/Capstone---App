import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
    const [isEnabled, setIsEnabled] = useState(true);
    const [sensitivity, setSensitivity] = useState<"low" | "medium" | "high">("medium");
    const [activeZones, setActiveZones] = useState([true, true, false, true]);

    const toggleZone = (index: number) => {
        const newZones = [...activeZones];
        newZones[index] = !newZones[index];
        setActiveZones(newZones);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FAFAFA" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Motion Setup</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* CAMERA FEED & ZONE SELECTOR */}
                <View style={styles.feedWrapper}>
                    <ImageBackground 
                        source={require("../../assets/images/camera-feed-test.png")} 
                        style={styles.cameraFeed}
                        imageStyle={{ borderRadius: 24 }}
                    >
                        {/* Interactive Zone Overlay */}
                        <View style={styles.zoneOverlay}>
                            {activeZones.map((active, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    onPress={() => toggleZone(i)}
                                    style={[
                                        styles.zoneBox, 
                                        active ? styles.zoneBoxActive : styles.zoneBoxInactive
                                    ]}
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
                <View style={styles.controlsCard}>
                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingTitle}>Enable Detection</Text>
                            <Text style={styles.settingDesc}>Monitor movement in active zones</Text>
                        </View>
                        <Switch 
                            value={isEnabled} 
                            onValueChange={setIsEnabled}
                            trackColor={{ false: "#27272A", true: "#8B5CF650" }}
                            thumbColor={isEnabled ? "#8B5CF6" : "#71717A"}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* SENSITIVITY SELECTOR */}
                    <View style={styles.sliderSection}>
                        <Text style={styles.settingTitle}>Sensitivity</Text>
                        <View style={styles.segmentRow}>
                            {(["low", "medium", "high"] as const).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[styles.segment, sensitivity === level && styles.segmentActive]}
                                    onPress={() => setSensitivity(level)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.segmentText, sensitivity === level && styles.segmentTextActive]}>
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ZONE CONFIG INFO */}
                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#8B5CF6" />
                    <Text style={styles.infoText}>
                        Tap boxes on the camera feed above to toggle motion detection zones.
                    </Text>
                </View>

                <TouchableOpacity style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Apply Configuration</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

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
        padding: 8,
    },
    headerTitle: {
        color: "#FAFAFA",
        fontSize: 18,
        fontWeight: "bold",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    feedWrapper: {
        width: '100%',
        aspectRatio: 16 / 10,
        marginBottom: 24,
    },
    cameraFeed: {
        flex: 1,
        overflow: 'hidden',
    },
    zoneOverlay: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        gap: 10,
    },
    zoneBox: {
        width: '48%',
        height: '46%',
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoneBoxActive: {
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    zoneBoxInactive: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    zoneLabel: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    zoneLabelText: {
        color: '#FAFAFA',
        fontSize: 10,
        fontWeight: 'bold',
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
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    liveText: {
        color: '#FAFAFA',
        fontSize: 10,
        fontWeight: 'bold',
    },
    controlsCard: {
        backgroundColor: "#09090B",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: "#18181B",
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingTitle: {
        color: "#FAFAFA",
        fontSize: 16,
        fontWeight: "bold",
    },
    settingDesc: {
        color: "#71717A",
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#18181B',
        marginVertical: 20,
    },
    sliderSection: {
        width: '100%',
    },
    segmentRow: {
        flexDirection: 'row',
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#27272A',
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
    },
    segmentActive: {
        backgroundColor: '#8B5CF6',
    },
    segmentText: {
        color: '#71717A',
        fontSize: 13,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: '#FAFAFA',
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
        borderColor: '#8B5CF620',
    },
    infoText: {
        color: '#A78BFA',
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    saveButton: {
        backgroundColor: '#FAFAFA',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    saveButtonText: {
        color: '#050505',
        fontSize: 16,
        fontWeight: 'bold',
    }
});