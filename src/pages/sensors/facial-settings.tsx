import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

type AccessLevel = "Admin" | "Resident" | "Scheduled Access";

type FaceProfile = {
    id: string;
    name: string;
    level: AccessLevel;
    lastSeen: string;
    scheduleDetails?: string;
};

export default function FacialSettings() {
    const router = useRouter();
    
    const [profiles, setProfiles] = useState<FaceProfile[]>([
        { id: "1", name: "Benji", level: "Admin", lastSeen: "2 mins ago" },
        { id: "2", name: "Sarah", level: "Resident", lastSeen: "4 hours ago" },
        { 
            id: "3", 
            name: "Housekeeper", 
            level: "Scheduled Access", 
            lastSeen: "Yesterday",
            scheduleDetails: "Mon/Wed • 9:00 AM - 12:00 PM"
        },
    ]);

    const handleRemove = (name: string) => {
        Alert.alert("Remove Profile", `Are you sure you want to delete ${name}'s facial data?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive" }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FAFAFA" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Face ID Management</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <TouchableOpacity style={styles.enrollCard} activeOpacity={0.8}>
                    <View style={styles.enrollIconWrapper}>
                        <MaterialCommunityIcons name="face-recognition" size={32} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.enrollTitle}>Enroll New Face</Text>
                        <Text style={styles.enrollDesc}>Setup a new high-fidelity scan</Text>
                    </View>
                    <MaterialCommunityIcons name="plus" size={24} color="#3B82F6" />
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Authorized Profiles</Text>

                {profiles.map((profile) => (
                    <View key={profile.id} style={styles.profileCard}>
                        <View style={styles.profileInfo}>
                            <View style={styles.avatarPlaceholder}>
                                <MaterialCommunityIcons name="account" size={24} color="#71717A" />
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.profileName}>{profile.name}</Text>
                                    {profile.level === "Scheduled Access" && (
                                        <View style={styles.scheduleBadge}>
                                            <Text style={styles.scheduleBadgeText}>Scheduled</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.profileSubText}>
                                    {profile.level} • Seen {profile.lastSeen}
                                </Text>
                                {profile.scheduleDetails && (
                                    <Text style={styles.scheduleDetailsText}>{profile.scheduleDetails}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.profileActions}>
                            {profile.level !== "Admin" && (
                                <TouchableOpacity 
                                    style={styles.iconActionBtn}
                                    onPress={() => handleRemove(profile.name)}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.manageBtn}>
                                <Text style={styles.manageBtnText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <Text style={styles.sectionLabel}>Global Access Policy</Text>

                <View style={styles.policyContainer}>
                    <View style={styles.policyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.policyTitle}>Unrecognized Face Action</Text>
                            <Text style={styles.policyDesc}>Always capture video and notify owner</Text>
                        </View>
                        <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.policyItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.policyTitle}>Active Schedule Enforcement</Text>
                            <Text style={styles.policyDesc}>Reject entry outside of assigned hours</Text>
                        </View>
                        <MaterialCommunityIcons name="clock-check-outline" size={24} color="#3B82F6" />
                    </View>
                </View>

                <View style={styles.storageBox}>
                    <Text style={styles.storageText}>Biometric Database: 3/20 Slots Used</Text>
                    <View style={styles.storageBarTrack}>
                        <View style={[styles.storageBarFill, { width: '15%' }]} />
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#050505" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
    headerTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "bold" },
    backButton: { padding: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionLabel: { color: "#71717A", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", marginBottom: 16, marginTop: 32 },
    
    enrollCard: { backgroundColor: "#3B82F610", borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3B82F630' },
    enrollIconWrapper: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#3B82F620', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    enrollTitle: { color: "#3B82F6", fontSize: 18, fontWeight: "bold" },
    enrollDesc: { color: "#3B82F680", fontSize: 13, marginTop: 2 },

    profileCard: { backgroundColor: "#09090B", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#18181B', marginBottom: 12 },
    profileInfo: { flexDirection: 'row', alignItems: 'flex-start' },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    profileName: { color: "#FAFAFA", fontSize: 16, fontWeight: "600" },
    profileSubText: { color: "#71717A", fontSize: 12, marginTop: 2 },
    scheduleDetailsText: { color: "#3B82F6", fontSize: 11, fontWeight: '500', marginTop: 4 },
    scheduleBadge: { backgroundColor: '#3B82F620', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    scheduleBadgeText: { color: '#3B82F6', fontSize: 10, fontWeight: 'bold' },
    
    profileActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#18181B', paddingTop: 12 },
    iconActionBtn: { padding: 8 },
    manageBtn: { backgroundColor: '#18181B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    manageBtnText: { color: '#FAFAFA', fontSize: 13, fontWeight: '600' },

    policyContainer: { backgroundColor: "#09090B", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#18181B' },
    policyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    policyTitle: { color: "#FAFAFA", fontSize: 15, fontWeight: "bold" },
    policyDesc: { color: "#71717A", fontSize: 12, marginTop: 4, paddingRight: 20 },
    divider: { height: 1, backgroundColor: '#18181B', marginVertical: 16 },

    storageBox: { marginTop: 40, alignItems: 'center' },
    storageText: { color: '#3F3F46', fontSize: 12, fontWeight: '600', marginBottom: 10 },
    storageBarTrack: { width: '100%', height: 4, backgroundColor: '#18181B', borderRadius: 2 },
    storageBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 }
});