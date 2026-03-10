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

type PinType = { id: string; label: string; code: string; strength: string; pinType?: string };
type OtpType = { id: string; label: string; code: string; expires: string };

export default function PinSettings() {
    const router = useRouter();
    const { deviceId } = useContext(AppContext);

    // UI States
    const [isAuthVisible, setIsAuthVisible] = useState(false);
    const [isPinVisible, setIsPinVisible] = useState(false);
    const [isAddPinVisible, setIsAddPinVisible] = useState(false);

    // Form States
    const [password, setPassword] = useState("");
    const [newPinLabel, setNewPinLabel] = useState("");
    const [newPinCode, setNewPinCode] = useState("");
    const [pendingAction, setPendingAction] = useState<"view" | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    // API & Data States
    const [pins, setPins] = useState<PinType[]>([]);
    const [otpCodes, setOtpCodes] = useState<OtpType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Animation Ref for the Shake Effect
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // --- API FUNCTIONS ---

    const fetchPins = useCallback(async () => {
        if (!deviceId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}pins/${deviceId}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const permanent: PinType[] = [];
            const otp: OtpType[] = [];
            for (const p of data) {
                if (p.pinType === "otp") {
                    otp.push({ id: p.id, label: p.label, code: p.code, expires: "24h" });
                } else {
                    permanent.push({
                        id: p.id,
                        label: p.label,
                        code: p.code,
                        strength: p.code?.length >= 6 ? "Strong" : "Moderate",
                        pinType: "permanent",
                    });
                }
            }
            setPins(permanent);
            setOtpCodes(otp);
        } catch {
            setPins([]);
            setOtpCodes([]);
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    useFocusEffect(
        useCallback(() => {
            fetchPins();
        }, [fetchPins])
    );

    // --- LOGIC FUNCTIONS ---

    const handleAuthCheck = () => {
        if (password === "password") {
            setIsAuthVisible(false);
            setPassword("");
            
            if (pendingAction === "view") setIsPinVisible(!isPinVisible);
            setPendingAction(null);
        } else {
            Alert.alert("Error", "Incorrect password. (Hint: use 'password')");
        }
    };

    const triggerSecureAction = (action: "view") => {
        setPendingAction(action);
        setIsAuthVisible(true);
    };

    const handleGenerateOtp = async () => {
        if (!deviceId) return;
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        try {
            const res = await fetch(`${API_BASE_URL}pins/${deviceId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: "Temp Guest Code", code: newCode, pinType: "otp" }),
            });
            if (!res.ok) throw new Error();
            const saved = await res.json();
            setOtpCodes(prev => [{ id: saved.id, label: saved.label, code: saved.code, expires: "24h" }, ...prev]);
        } catch {
            Alert.alert("Error", "Failed to generate OTP.");
        }
    };

    const triggerShake = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const closeAddModal = () => {
        setIsAddPinVisible(false);
        setNewPinLabel("");
        setNewPinCode("");
        setErrorMessage("");
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
            const res = await fetch(`${API_BASE_URL}pins/${deviceId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    const handleDeletePin = (id: string, label: string, isOtp = false) => {
        Alert.alert("Delete PIN", `Delete the "${label}" code?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setDeletingId(id);
                    try {
                        await fetch(`${API_BASE_URL}pins/${deviceId}/${id}`, {
                            method: "DELETE",
                        });
                        if (isOtp) {
                            setOtpCodes(prev => prev.filter(o => o.id !== id));
                        } else {
                            setPins(prev => prev.filter(p => p.id !== id));
                        }
                    } catch {
                        Alert.alert("Error", "Failed to delete PIN.");
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
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
                
                {/* 1. ONE-TIME PIN SECTION */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>One-Time PINs</Text>
                    <TouchableOpacity 
                        style={styles.smallAddBtn} 
                        onPress={handleGenerateOtp} 
                        activeOpacity={0.6}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <MaterialCommunityIcons name="plus" size={18} color="#050505" />
                        <Text style={styles.smallAddBtnText}>Add PIN</Text>
                    </TouchableOpacity>
                </View>

                {otpCodes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No active one-time codes</Text>
                    </View>
                ) : (
                    otpCodes.map((otp) => (
                        <View key={otp.id} style={styles.otpCard}>
                            <View>
                                <Text style={styles.otpLabel}>{otp.label}</Text>
                                <View style={styles.otpCodeRow}>
                                    <Text style={styles.otpCodeText}>{otp.code}</Text>
                                    <View style={styles.expiresBadge}>
                                        <Text style={styles.expiresText}>Expires: {otp.expires}</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleDeletePin(otp.id, otp.label, true)}
                                style={{ padding: 12 }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialCommunityIcons name="close-circle-outline" size={24} color="#71717A" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                {/* 2. PERMANENT CODES SECTION */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>Permanent Access</Text>
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
                        <Text style={styles.emptyStateText}>No permanent codes configured</Text>
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

                {/* GLOBAL ACTIONS */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => triggerSecureAction("view")} activeOpacity={0.8}>
                        <MaterialCommunityIcons name={isPinVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#FAFAFA" />
                        <Text style={styles.actionButtonText}>
                            {isPinVisible ? "Hide PIN Codes" : "Reveal PIN Codes"}
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* PASSWORD AUTHENTICATION MODAL */}
            <Modal visible={isAuthVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="shield-key-outline" size={48} color="#A1A1AA" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.modalTitle}>Secure Access</Text>
                        <Text style={styles.modalSubtitle}>Enter password to modify system keys.</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Password (type 'password')"
                            placeholderTextColor="#71717A"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAuthVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleAuthCheck}>
                                <Text style={styles.confirmBtnText}>Authorize</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ADD PERMANENT PIN MODAL WITH ANIMATED SHAKE */}
            <Modal visible={isAddPinVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContent, { transform: [{ translateX: shakeAnim }] }]}>
                        <Text style={styles.modalTitle}>Create New PIN</Text>
                        <Text style={styles.modalSubtitle}>Assign a name and code for permanent access.</Text>
                        
                        {errorMessage !== "" && (
                            <View style={styles.errorBox}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        )}

                        <TextInput
                            style={[
                                styles.input, 
                                { marginBottom: 12 },
                                errorMessage.includes("label") && styles.inputError
                            ]}
                            placeholder="e.g. Dog Walker, Kids"
                            placeholderTextColor="#71717A"
                            value={newPinLabel}
                            onChangeText={(text) => { setNewPinLabel(text); setErrorMessage(""); }}
                        />
                        <TextInput
                            style={[
                                styles.input,
                                errorMessage.includes("PIN") && styles.inputError
                            ]}
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
    headerTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "bold" },
    backButton: { padding: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 24, zIndex: 10 },
    sectionLabel: { color: "#71717A", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 },
    
    smallAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6 },
    smallAddBtnText: { color: '#050505', fontSize: 13, fontWeight: 'bold' },

    // OTP Styles
    otpCard: { backgroundColor: "#111111", borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 12 },
    otpLabel: { color: "#71717A", fontSize: 12, marginBottom: 6 },
    otpCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    otpCodeText: { color: "#FAFAFA", fontSize: 24, fontWeight: "bold", letterSpacing: 2 },
    expiresBadge: { backgroundColor: '#EF444415', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    expiresText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
    
    emptyState: { padding: 20, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#27272A', borderRadius: 20 },
    emptyStateText: { color: '#3F3F46', fontSize: 13 },

    // Permanent PIN Cards
    pinCard: { backgroundColor: "#09090B", borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#18181B', marginBottom: 12 },
    pinCardLeft: { flex: 1 },
    pinCardRight: { flexDirection: 'row', alignItems: 'center' },
    pinLabel: { color: "#71717A", fontSize: 13, marginBottom: 4 },
    pinCodeDisplay: { color: "#FAFAFA", fontSize: 24, fontWeight: "bold", letterSpacing: 4 },
    strengthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    strengthText: { fontSize: 11, fontWeight: "bold" },
    
    actionsContainer: { marginTop: 24, gap: 12 },
    actionButton: { backgroundColor: "#18181B", height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    actionButtonText: { color: "#FAFAFA", fontSize: 16, fontWeight: "600" },

    // Shared Modal Styles
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: "#111111", borderRadius: 28, padding: 28, borderWidth: 1, borderColor: "#1F1F1F" },
    modalTitle: { color: "#FAFAFA", fontSize: 20, fontWeight: "bold", textAlign: 'center' },
    modalSubtitle: { color: "#71717A", fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    input: { backgroundColor: "#050505", height: 56, borderRadius: 12, color: "#FAFAFA", paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: "#27272A" },
    inputError: { borderColor: "#EF4444", backgroundColor: "#EF444405" },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444415', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: '#EF444430' },
    errorText: { color: '#EF4444', fontSize: 13, fontWeight: '500' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { color: "#71717A", fontWeight: "600", fontSize: 15 },
    confirmBtn: { flex: 1, height: 50, backgroundColor: "#FAFAFA", borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: "#050505", fontWeight: "bold", fontSize: 15 }
});