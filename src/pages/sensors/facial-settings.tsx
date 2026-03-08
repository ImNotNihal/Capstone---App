import { API_BASE_URL } from "@/src/config";
import { AppContext } from "@/src/context/app-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
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
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

type AccessLevel = "Admin" | "Resident" | "Scheduled Access";

type FaceProfile = {
    id: string;
    name: string;
    accessLevel: AccessLevel;
    scheduleDetails?: string;
    enrolledAt?: string;
    level: AccessLevel;
    lastSeen: string;
    scheduleDetails?: string;
};

export default function FacialSettings() {
    const router = useRouter();
    const { authToken, deviceId } = useContext(AppContext);

    const [profiles, setProfiles] = useState<FaceProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const [enrollName, setEnrollName] = useState("");
    const [enrollLevel, setEnrollLevel] = useState<AccessLevel>("Resident");
    const [enrollSchedule, setEnrollSchedule] = useState("");
    const [enrollSaving, setEnrollSaving] = useState(false);
    const [enrollError, setEnrollError] = useState("");

    const authHeaders = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchProfiles = useCallback(async () => {
        if (!authToken || !deviceId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/faces`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setProfiles(data.map((p: any) => ({
                id: p.id,
                name: p.name,
                accessLevel: p.accessLevel || "Resident",
                scheduleDetails: p.scheduleDetails,
                enrolledAt: p.enrolledAt,
            })));
        } catch {
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    }, [authToken, deviceId, authHeaders]);

    useFocusEffect(
        useCallback(() => {
            fetchProfiles();
        }, [fetchProfiles])
    );

    const handleDelete = (id: string, name: string) => {
        Alert.alert("Remove Profile", `Delete ${name}'s facial data?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setDeletingId(id);
                    try {
                        await fetch(`${API_BASE_URL}devices/${deviceId}/faces/${id}`, {
                            method: "DELETE",
                            headers: authHeaders(),
                        });
                        setProfiles((prev) => prev.filter((p) => p.id !== id));
                    } catch {
                        Alert.alert("Error", "Failed to remove profile.");
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    const handleEnroll = async () => {
        if (!enrollName.trim()) {
            setEnrollError("Please enter a name.");
            return;
        }
        setEnrollSaving(true);
        setEnrollError("");
        try {
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/faces`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    name: enrollName.trim(),
                    accessLevel: enrollLevel,
                    scheduleDetails: enrollLevel === "Scheduled Access" ? enrollSchedule : undefined,
                }),
            });
            if (!res.ok) throw new Error();
            const newProfile = await res.json();
            setProfiles((prev) => [...prev, {
                id: newProfile.id,
                name: newProfile.name,
                accessLevel: newProfile.accessLevel,
                scheduleDetails: newProfile.scheduleDetails,
                enrolledAt: newProfile.enrolledAt,
            }]);
            closeEnrollModal();
        } catch {
            setEnrollError("Failed to enroll. Try again.");
        } finally {
            setEnrollSaving(false);
        }
    };

    const closeEnrollModal = () => {
        setIsEnrollOpen(false);
        setEnrollName("");
        setEnrollLevel("Resident");
        setEnrollSchedule("");
        setEnrollError("");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

    
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

                {/* ENROLL BUTTON */}
                <TouchableOpacity style={styles.enrollCard} onPress={() => setIsEnrollOpen(true)} activeOpacity={0.8}>
                
                <TouchableOpacity style={styles.enrollCard} activeOpacity={0.8}>
                    <View style={styles.enrollIconWrapper}>
                        <MaterialCommunityIcons name="face-recognition" size={32} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.enrollTitle}>Enroll New Face</Text>
                        <Text style={styles.enrollDesc}>Register a face for access</Text>
                        <Text style={styles.enrollDesc}>Setup a new high-fidelity scan</Text>
                    </View>
                    <MaterialCommunityIcons name="plus" size={24} color="#3B82F6" />
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Authorized Profiles</Text>

                {loading ? (
                    <View style={{ paddingVertical: 32, alignItems: "center" }}>
                        <ActivityIndicator color="#FAFAFA" />
                    </View>
                ) : profiles.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="face-recognition" size={40} color="#27272A" />
                        <Text style={styles.emptyTitle}>No face profiles enrolled</Text>
                        <Text style={styles.emptySubtitle}>Tap "Enroll New Face" to add one.</Text>
                    </View>
                ) : (
                    profiles.map((profile) => (
                        <View key={profile.id} style={styles.profileCard}>
                            <View style={styles.profileInfo}>
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialCommunityIcons name="account" size={24} color="#71717A" />
                                </View>
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.profileName}>{profile.name}</Text>
                                        {profile.accessLevel === "Scheduled Access" && (
                                            <View style={styles.scheduleBadge}>
                                                <Text style={styles.scheduleBadgeText}>Scheduled</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.profileSubText}>{profile.accessLevel}</Text>
                                    {profile.scheduleDetails && (
                                        <Text style={styles.scheduleDetailsText}>{profile.scheduleDetails}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.profileActions}>
                                {deletingId === profile.id ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.iconActionBtn}
                                        onPress={() => handleDelete(profile.id, profile.name)}
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}

                {/* Storage info */}
                <View style={styles.storageBox}>
                    <Text style={styles.storageText}>
                        Biometric Database: {profiles.length}/20 Slots Used
                    </Text>
                    <View style={styles.storageBarTrack}>
                        <View style={[styles.storageBarFill, { width: `${Math.min((profiles.length / 20) * 100, 100)}%` }]} />
                    </View>
                </View>

            </ScrollView>

            {/* ENROLL MODAL */}
            <Modal visible={isEnrollOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enroll New Face</Text>
                        <Text style={styles.modalSubtitle}>Enter the person's name and access level.</Text>

                        {enrollError !== "" && (
                            <View style={styles.errorBox}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                                <Text style={styles.errorText}>{enrollError}</Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Full name"
                            placeholderTextColor="#71717A"
                            value={enrollName}
                            onChangeText={(t) => { setEnrollName(t); setEnrollError(""); }}
                        />

                        <Text style={styles.fieldLabel}>Access Level</Text>
                        <View style={styles.levelRow}>
                            {(["Resident", "Admin", "Scheduled Access"] as AccessLevel[]).map((lvl) => (
                                <TouchableOpacity
                                    key={lvl}
                                    style={[styles.levelChip, enrollLevel === lvl && styles.levelChipActive]}
                                    onPress={() => setEnrollLevel(lvl)}
                                >
                                    <Text style={[styles.levelChipText, enrollLevel === lvl && styles.levelChipTextActive]}>
                                        {lvl}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {enrollLevel === "Scheduled Access" && (
                            <TextInput
                                style={[styles.input, { marginTop: 12 }]}
                                placeholder="e.g. Mon/Wed 9:00AM - 12:00PM"
                                placeholderTextColor="#71717A"
                                value={enrollSchedule}
                                onChangeText={setEnrollSchedule}
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={closeEnrollModal}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleEnroll} disabled={enrollSaving}>
                                {enrollSaving
                                    ? <ActivityIndicator color="#050505" />
                                    : <Text style={styles.confirmBtnText}>Enroll</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    headerTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "700" },
    backButton: { padding: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionLabel: { color: "#71717A", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, marginTop: 32 },
    enrollCard: { backgroundColor: "#3B82F610", borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3B82F630' },
    enrollIconWrapper: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#3B82F620', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    enrollTitle: { color: "#3B82F6", fontSize: 16, fontWeight: "700" },
    enrollDesc: { color: "#3B82F680", fontSize: 13, marginTop: 2 },
    emptyState: { alignItems: "center", paddingVertical: 40, borderWidth: 1, borderStyle: "dashed", borderColor: "#27272A", borderRadius: 20, gap: 8 },
    emptyTitle: { color: "#71717A", fontSize: 15, fontWeight: "600" },
    emptySubtitle: { color: "#3F3F46", fontSize: 13 },
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
    profileName: { color: "#FAFAFA", fontSize: 15, fontWeight: "600" },
    profileSubText: { color: "#71717A", fontSize: 12, marginTop: 2 },
    scheduleDetailsText: { color: "#3B82F6", fontSize: 11, fontWeight: '500', marginTop: 4 },
    scheduleBadge: { backgroundColor: '#3B82F620', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    scheduleBadgeText: { color: '#3B82F6', fontSize: 10, fontWeight: '700' },
    profileActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#18181B', paddingTop: 12 },
    iconActionBtn: { padding: 8 },
    storageBox: { marginTop: 40, alignItems: 'center' },
    storageText: { color: '#3F3F46', fontSize: 12, fontWeight: '600', marginBottom: 10 },
    storageBarTrack: { width: '100%', height: 4, backgroundColor: '#18181B', borderRadius: 2 },
    storageBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: "#111111", borderRadius: 28, padding: 28, borderWidth: 1, borderColor: "#1F1F1F" },
    modalTitle: { color: "#FAFAFA", fontSize: 20, fontWeight: "700", textAlign: 'center' },
    modalSubtitle: { color: "#71717A", fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 20 },
    input: { backgroundColor: "#050505", height: 56, borderRadius: 12, color: "#FAFAFA", paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: "#27272A" },
    fieldLabel: { color: "#71717A", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 8 },
    levelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    levelChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#18181B", borderWidth: 1, borderColor: "#27272A" },
    levelChipActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
    levelChipText: { color: "#71717A", fontSize: 13, fontWeight: "600" },
    levelChipTextActive: { color: "#FAFAFA" },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444415', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: '#EF444430' },
    errorText: { color: '#EF4444', fontSize: 13 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { color: "#71717A", fontWeight: "600", fontSize: 15 },
    confirmBtn: { flex: 1, height: 50, backgroundColor: "#FAFAFA", borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: "#050505", fontWeight: "700", fontSize: 15 },
});
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
