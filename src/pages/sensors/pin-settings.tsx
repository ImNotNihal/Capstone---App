import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
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

export default function PinSettings() {
    const router = useRouter();
    const [isAuthVisible, setIsAuthVisible] = useState(false);
    const [isPinVisible, setIsPinVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [pendingAction, setPendingAction] = useState<"view" | "reset" | "generate_otp" | null>(null);

    // Master/Permanent PINs
    const [pins, setPins] = useState([
        { id: "1", label: "Master Code", code: "4829", strength: "Strong" },
        { id: "2", label: "Housekeeper", code: "0912", strength: "Moderate" },
    ]);

    // One-Time PINs
    const [otpCodes, setOtpCodes] = useState([
        { id: "otp1", label: "UPS Delivery", code: "7721", expires: "2h 14m" },
    ]);

    const handleAuthCheck = () => {
        // In a real app, validate against backend
        if (password === "password") {
            setIsAuthVisible(false);
            setPassword("");
            if (pendingAction === "view") setIsPinVisible(true);
            if (pendingAction === "reset") Alert.alert("Reset", "Master Code reset flow started.");
            if (pendingAction === "generate_otp") {
                const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                setOtpCodes([{ id: Date.now().toString(), label: "New Temporary Code", code: newCode, expires: "24h" }, ...otpCodes]);
            }
        } else {
            Alert.alert("Error", "Incorrect password");
        }
    };

    const triggerSecureAction = (action: "view" | "reset" | "generate_otp") => {
        setPendingAction(action);
        setIsAuthVisible(true);
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

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* 1. ONE-TIME PIN SECTION */}
                <View style={styles.otpHeaderRow}>
                    <Text style={styles.sectionLabel}>One-Time PINs</Text>
                    <TouchableOpacity 
                        style={styles.generateOtpBtn}
                        onPress={() => triggerSecureAction("generate_otp")}
                    >
                        <MaterialCommunityIcons name="plus" size={16} color="#050505" />
                        <Text style={styles.generateOtpText}>Generate</Text>
                    </TouchableOpacity>
                </View>

                {otpCodes.map((otp) => (
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
                        <TouchableOpacity onPress={() => setOtpCodes(otpCodes.filter(o => o.id !== otp.id))}>
                            <MaterialCommunityIcons name="close-circle-outline" size={22} color="#71717A" />
                        </TouchableOpacity>
                    </View>
                ))}

                {otpCodes.length === 0 && (
                    <View style={styles.emptyOtpState}>
                        <Text style={styles.emptyOtpText}>No active one-time codes</Text>
                    </View>
                )}

                {/* 2. PERMANENT CODES SECTION */}
                <Text style={styles.sectionLabel}>Permanent Access</Text>
                {pins.map((item) => (
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
                        </View>
                    </View>
                ))}

                {/* GLOBAL ACTIONS */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => triggerSecureAction("view")}
                    >
                        <MaterialCommunityIcons name={isPinVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#FAFAFA" />
                        <Text style={styles.actionButtonText}>
                            {isPinVisible ? "Hide PIN Codes" : "Reveal PIN Codes"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionButton, styles.resetButton]} 
                        onPress={() => triggerSecureAction("reset")}
                    >
                        <MaterialCommunityIcons name="refresh" size={22} color="#F59E0B" />
                        <Text style={[styles.actionButtonText, { color: "#F59E0B" }]}>Reset Master Code</Text>
                    </TouchableOpacity>
                </View>

                {/* SECURITY FOOTER */}
                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="shield-lock" size={24} color="#F59E0B" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTitle}>One-Time Security</Text>
                        <Text style={styles.infoText}>
                            One-time codes expire automatically after a single successful entry or after 24 hours.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* AUTHENTICATION MODAL */}
            <Modal visible={isAuthVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.authModal}>
                        <MaterialCommunityIcons name="shield-key-outline" size={48} color="#A1A1AA" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.authTitle}>Secure Access</Text>
                        <Text style={styles.authSubtitle}>Enter password to modify system keys.</Text>
                        
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
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

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#050505" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
    headerTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "bold" },
    backButton: { padding: 8 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    // Section Labels
    sectionLabel: { color: "#71717A", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", marginBottom: 16, marginTop: 24 },
    
    // OTP Styles
    otpHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    generateOtpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
    generateOtpText: { color: '#050505', fontSize: 12, fontWeight: 'bold' },
    otpCard: { backgroundColor: "#111111", borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 12 },
    otpLabel: { color: "#71717A", fontSize: 12, marginBottom: 6 },
    otpCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    otpCodeText: { color: "#FAFAFA", fontSize: 24, fontWeight: "bold", letterSpacing: 2 },
    expiresBadge: { backgroundColor: '#EF444415', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    expiresText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
    emptyOtpState: { padding: 20, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#27272A', borderRadius: 20 },
    emptyOtpText: { color: '#3F3F46', fontSize: 13 },

    // Permanent PIN Cards
    pinCard: { backgroundColor: "#09090B", borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#18181B', marginBottom: 12 },
    pinLabel: { color: "#71717A", fontSize: 13, marginBottom: 4 },
    pinCodeDisplay: { color: "#FAFAFA", fontSize: 24, fontWeight: "bold", letterSpacing: 4 },
    strengthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    strengthText: { fontSize: 11, fontWeight: "bold" },
    
    actionsContainer: { marginTop: 24, gap: 12 },
    actionButton: { backgroundColor: "#18181B", height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    resetButton: { borderColor: "#F59E0B20", borderWidth: 1 },
    actionButtonText: { color: "#FAFAFA", fontSize: 16, fontWeight: "600" },
    
    infoBox: { backgroundColor: "#F59E0B10", padding: 20, borderRadius: 24, marginTop: 40, flexDirection: 'row', gap: 16, borderWidth: 1, borderColor: '#F59E0B20' },
    infoTitle: { color: "#F59E0B", fontSize: 15, fontWeight: "bold", marginBottom: 4 },
    infoText: { color: "#A1A1AA", fontSize: 13, lineHeight: 18 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: 'center', padding: 24 },
    authModal: { backgroundColor: "#111111", borderRadius: 28, padding: 28, borderWidth: 1, borderColor: "#1F1F1F" },
    authTitle: { color: "#FAFAFA", fontSize: 20, fontWeight: "bold", textAlign: 'center' },
    authSubtitle: { color: "#71717A", fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    passwordInput: { backgroundColor: "#050505", height: 56, borderRadius: 12, color: "#FAFAFA", paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: "#27272A" },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { color: "#71717A", fontWeight: "600" },
    confirmBtn: { flex: 2, height: 50, backgroundColor: "#FAFAFA", borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: "#050505", fontWeight: "bold" }
});