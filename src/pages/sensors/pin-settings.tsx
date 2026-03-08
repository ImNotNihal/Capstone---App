import { API_BASE_URL } from "@/src/config";
import { AppContext } from "@/src/context/app-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

type PinType = { id: string; label: string; code: string; strength: string; pinType: string };

export default function PinSettings() {
    const router = useRouter();
    const { authToken, deviceId } = useContext(AppContext);

    const [isPinVisible, setIsPinVisible] = useState(false);
    const [isAddPinVisible, setIsAddPinVisible] = useState(false);
    const [newPinLabel, setNewPinLabel] = useState("");
    const [newPinCode, setNewPinCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [pins, setPins] = useState<PinType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const authHeaders = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchPins = useCallback(async () => {
        if (!authToken || !deviceId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/pins`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setPins(data.map((p: any) => ({
                id: p.id,
                label: p.label,
                code: p.code,
                strength: p.strength || (p.code?.length >= 6 ? "Strong" : "Moderate"),
                pinType: p.pinType || "permanent",
            })));
        } catch {
            setPins([]);
        } finally {
            setLoading(false);
        }
    }, [authToken, deviceId, authHeaders]);

    useFocusEffect(
        useCallback(() => {
            fetchPins();
        }, [fetchPins])
    );

    const triggerShake = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleAddPin = async () => {
        if (newPinLabel.trim() === "") {
            setErrorMessage("Please provide a label.");
            triggerShake();
            return;
        }
        if (newPinCode.trim().length < 4) {
            setErrorMessage("PIN must be at least 4 digits.");
            triggerShake();
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/pins`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ label: newPinLabel, code: newPinCode, pinType: "permanent" }),
            });
            if (!res.ok) throw new Error();
            const newPin = await res.json();
            setPins((prev) => [...prev, {
                id: newPin.id,
                label: newPin.label,
                code: newPin.code,
                strength: newPin.strength,
                pinType: newPin.pinType,
            }]);
            closeAddModal();
        } catch {
            setErrorMessage("Failed to save PIN. Try again.");
            triggerShake();
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePin = (id: string, label: string) => {
        Alert.alert("Delete PIN", `Delete the "${label}" code?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setDeletingId(id);
                    try {
                        await fetch(`${API_BASE_URL}devices/${deviceId}/pins/${id}`, {
                            method: "DELETE",
                            headers: authHeaders(),
                        });
                        setPins((prev) => prev.filter((p) => p.id !== id));
                    } catch {
                        Alert.alert("Error", "Failed to delete PIN.");
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    const closeAddModal = () => {
        setIsAddPinVisible(false);
        setNewPinLabel("");
        setNewPinCode("");
        setErrorMessage("");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FAFAFA" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PIN Configuration</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* PERMANENT CODES SECTION */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>Access PINs</Text>
                    <TouchableOpacity
                        style={styles.smallAddBtn}
                        onPress={() => setIsAddPinVisible(true)}
                        activeOpacity={0.6}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <MaterialCommunityIcons name="plus" size={18} color="#050505" />
                        <Text style={styles.smallAddBtnText}>Add PIN</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ paddingVertical: 32, alignItems: "center" }}>
                        <ActivityIndicator color="#FAFAFA" />
                    </View>
                ) : pins.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No PIN codes configured</Text>
                    </View>
                ) : (
                    pins.map((item) => (
                        <View key={item.id} style={styles.pinCard}>
                            <View style={styles.pinCardLeft}>
                                <Text style={styles.pinLabel}>{item.label}</Text>
                                <Text style={styles.pinCodeDisplay}>
                                    {isPinVisible ? item.code : "••••"}
                                </Text>
                            </View>
                            <View style={styles.pinCardRight}>
                                <View style={[styles.strengthBadge, { backgroundColor: item.strength === "Strong" ? "#10B98120" : "#F59E0B20" }]}>
                                    <Text style={[styles.strengthText, { color: item.strength === "Strong" ? "#10B981" : "#F59E0B" }]}>
                                        {item.strength}
                                    </Text>
                                </View>
                                {deletingId === item.id ? (
                                    <ActivityIndicator size="small" color="#EF4444" style={{ marginLeft: 12 }} />
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => handleDeletePin(item.id, item.label)}
                                        style={{ marginLeft: 12, padding: 8 }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setIsPinVisible(!isPinVisible)} activeOpacity={0.8}>
                        <MaterialCommunityIcons name={isPinVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#FAFAFA" />
                        <Text style={styles.actionButtonText}>
                            {isPinVisible ? "Hide PIN Codes" : "Reveal PIN Codes"}
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* ADD PIN MODAL */}
            <Modal visible={isAddPinVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContent, { transform: [{ translateX: shakeAnim }] }]}>
                        <Text style={styles.modalTitle}>Create New PIN</Text>
                        <Text style={styles.modalSubtitle}>Assign a name and code for access.</Text>

                        {errorMessage !== "" && (
                            <View style={styles.errorBox}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        )}

                        <TextInput
                            style={[styles.input, { marginBottom: 12 }, errorMessage.includes("label") && styles.inputError]}
                            placeholder="e.g. Dog Walker, Kids"
                            placeholderTextColor="#71717A"
                            value={newPinLabel}
                            onChangeText={(text) => { setNewPinLabel(text); setErrorMessage(""); }}
                        />
                        <TextInput
                            style={[styles.input, errorMessage.includes("PIN") && styles.inputError]}
                            placeholder="4 to 8 digit code"
                            placeholderTextColor="#71717A"
                            keyboardType="number-pad"
                            maxLength={8}
                            secureTextEntry
                            value={newPinCode}
                            onChangeText={(text) => { setNewPinCode(text); setErrorMessage(""); }}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleAddPin} disabled={saving}>
                                {saving ? <ActivityIndicator color="#050505" /> : <Text style={styles.confirmBtnText}>Save PIN</Text>}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#050505" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
    headerTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "700" },
    backButton: { padding: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 24, zIndex: 10 },
    sectionLabel: { color: "#71717A", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
    smallAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6 },
    smallAddBtnText: { color: '#050505', fontSize: 13, fontWeight: '700' },
    emptyState: { padding: 20, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#27272A', borderRadius: 20 },
    emptyStateText: { color: '#3F3F46', fontSize: 13 },
    pinCard: { backgroundColor: "#09090B", borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#18181B', marginBottom: 12 },
    pinCardLeft: { flex: 1 },
    pinCardRight: { flexDirection: 'row', alignItems: 'center' },
    pinLabel: { color: "#71717A", fontSize: 13, marginBottom: 4 },
    pinCodeDisplay: { color: "#FAFAFA", fontSize: 24, fontWeight: "700", letterSpacing: 4 },
    strengthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    strengthText: { fontSize: 11, fontWeight: "700" },
    actionsContainer: { marginTop: 24, gap: 12 },
    actionButton: { backgroundColor: "#18181B", height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    actionButtonText: { color: "#FAFAFA", fontSize: 15, fontWeight: "600" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: "#111111", borderRadius: 28, padding: 28, borderWidth: 1, borderColor: "#1F1F1F" },
    modalTitle: { color: "#FAFAFA", fontSize: 20, fontWeight: "700", textAlign: 'center' },
    modalSubtitle: { color: "#71717A", fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    input: { backgroundColor: "#050505", height: 56, borderRadius: 12, color: "#FAFAFA", paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: "#27272A" },
    inputError: { borderColor: "#EF4444", backgroundColor: "#EF444405" },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444415', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: '#EF444430' },
    errorText: { color: '#EF4444', fontSize: 13, fontWeight: '500' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { color: "#71717A", fontWeight: "600", fontSize: 15 },
    confirmBtn: { flex: 1, height: 50, backgroundColor: "#FAFAFA", borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: "#050505", fontWeight: "700", fontSize: 15 },
});
