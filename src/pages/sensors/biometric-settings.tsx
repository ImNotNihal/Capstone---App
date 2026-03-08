import { API_BASE_URL } from "@/src/config";
import { AppContext } from "@/src/context/app-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Modal,
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

type FingerprintProfile = {
    id: string;
    label: string;
    userId: string;
    createdAt: string;
};

// Step-by-step enrollment wizard steps
type EnrollStep = "label" | "scanning" | "done";

export default function BiometricSettings() {
    const router = useRouter();
    const { authToken, deviceId } = useContext(AppContext);

    const [prints, setPrints] = useState<FingerprintProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Enrollment wizard
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [enrollStep, setEnrollStep] = useState<EnrollStep>("label");
    const [enrollLabel, setEnrollLabel] = useState("");
    const [enrollError, setEnrollError] = useState("");
    const [enrollSaving, setEnrollSaving] = useState(false);

    // Pulse animation for scan step
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (enrollStep === "scanning") {
            // Simulate scanning animation for 3s, then move to done
            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                        Animated.timing(pulseOpacity, { toValue: 0.8, duration: 600, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.in(Easing.ease), useNativeDriver: true }),
                        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
                    ]),
                ])
            ).start();

            const timer = setTimeout(() => {
                pulseAnim.stopAnimation();
                pulseOpacity.stopAnimation();
                setEnrollStep("done");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [enrollStep]);

    const authHeaders = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    const fetchPrints = useCallback(async () => {
        if (!authToken || !deviceId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/fingerprints`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setPrints(data.map((p: any) => ({
                id: p.id,
                label: p.label,
                userId: p.userId,
                createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—",
            })));
        } catch {
            setPrints([]);
        } finally {
            setLoading(false);
        }
    }, [authToken, deviceId, authHeaders]);

    useFocusEffect(
        useCallback(() => {
            fetchPrints();
        }, [fetchPrints])
    );

    const handleRemovePrint = (id: string, label: string) => {
        const doDelete = async () => {
            setDeletingId(id);
            try {
                await fetch(`${API_BASE_URL}devices/${deviceId}/fingerprints/${id}`, {
                    method: "DELETE",
                    headers: authHeaders(),
                });
                setPrints((prev) => prev.filter((p) => p.id !== id));
            } catch {
                Alert.alert("Error", "Failed to remove fingerprint.");
            } finally {
                setDeletingId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Remove fingerprint "${label}"?`)) doDelete();
        } else {
            Alert.alert("Remove Fingerprint", `Remove "${label}"?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: doDelete },
            ]);
        }
    };

    const startEnrollment = () => {
        setEnrollLabel("");
        setEnrollError("");
        setEnrollStep("label");
        setIsWizardOpen(true);
    };

    const proceedToScan = () => {
        if (!enrollLabel.trim()) {
            setEnrollError("Please enter a name for this fingerprint.");
            return;
        }
        setEnrollError("");
        setEnrollStep("scanning");
    };

    const saveEnrollment = async () => {
        setEnrollSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/fingerprints`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ label: enrollLabel.trim() }),
            });
            if (!res.ok) throw new Error();
            const newPrint = await res.json();
            setPrints((prev) => [...prev, {
                id: newPrint.id,
                label: newPrint.label,
                userId: newPrint.userId,
                createdAt: new Date(newPrint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            }]);
            setIsWizardOpen(false);
        } catch {
            Alert.alert("Error", "Failed to save fingerprint. Try again.");
            setEnrollStep("label");
        } finally {
            setEnrollSaving(false);
        }
    };

    const closeWizard = () => {
        setIsWizardOpen(false);
        pulseAnim.stopAnimation();
        pulseOpacity.stopAnimation();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

    owner: string;
    dateAdded: string;
};

export default function BiometricSettings() {
    const router = useRouter();

    const [prints, setPrints] = useState<FingerprintProfile[]>([]);

    const handleAddPrint = () => {
        const uniqueId = `print_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const newPrint: FingerprintProfile = {
            id: uniqueId,
            label: `Fingerprint ${prints.length + 1}`,
            owner: "Current User",
            dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        setPrints(prev => [...prev, newPrint]);
    };

    const handleRemovePrint = (id: string, label: string, owner: string) => {
        // FIXED: Handle Web Browser popup limits vs Native Phone alerts
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Are you sure you want to delete ${owner}'s ${label}?`);
            if (confirmed) {
                setPrints(currentPrints => currentPrints.filter(p => p.id !== id));
            }
        } else {
            Alert.alert(
                "Remove Fingerprint",
                `Are you sure you want to delete ${owner}'s ${label}?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Delete", 
                        style: "destructive",
                        onPress: () => {
                            setPrints(currentPrints => currentPrints.filter(p => p.id !== id));
                        } 
                    }
                ],
                { cancelable: true }
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FAFAFA" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Biometric Setup</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
            >
                {/* ADD NEW PRINT */}
                <TouchableOpacity style={styles.registerCard} activeOpacity={0.7} onPress={startEnrollment}>
            {/* keyboardShouldPersistTaps="always" guarantees taps bypass the scroll listener entirely */}
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
            >
                
                {/* REGISTER NEW PRINT */}
                <TouchableOpacity 
                    style={styles.registerCard} 
                    activeOpacity={0.7} 
                    onPress={handleAddPrint}
                >
                    <View style={styles.registerIconWrapper}>
                        <MaterialCommunityIcons name="fingerprint" size={32} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.registerTitle}>Add Fingerprint</Text>
                        <Text style={styles.registerDesc}>Register a new biometric key</Text>
                    </View>
                    <MaterialCommunityIcons name="plus" size={24} color="#10B981" />
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Registered Prints</Text>

                {loading ? (
                    <View style={{ paddingVertical: 32, alignItems: "center" }}>
                        <ActivityIndicator color="#FAFAFA" />
                    </View>
                ) : prints.length === 0 ? (
                {/* FINGERPRINT LIST OR EMPTY STATE */}
                {prints.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No fingerprints registered</Text>
                    </View>
                ) : (
                    prints.map((print) => (
                        <View key={print.id} style={styles.printCard}>
                            <View style={styles.printInfo}>
                                <View style={styles.printIconSmall}>
                                    <MaterialCommunityIcons name="fingerprint" size={20} color="#71717A" />
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.printLabelText}>{print.label}</Text>
                                    <Text style={styles.printOwnerText}>{print.createdAt}</Text>
                                </View>
                            </View>
                            {deletingId === print.id ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <TouchableOpacity
                                    onPress={() => handleRemovePrint(print.id, print.label)}
                                    style={styles.deleteBtn}
                                    activeOpacity={0.6}
                                >
                                    <MaterialCommunityIcons name="minus-circle-outline" size={26} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                                    <Text style={styles.printOwnerText}>{print.owner} • {print.dateAdded}</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={() => handleRemovePrint(print.id, print.label, print.owner)}
                                style={styles.deleteBtn}
                                activeOpacity={0.6}
                            >
                                <MaterialCommunityIcons name="minus-circle-outline" size={26} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                <Text style={styles.sectionLabel}>Hardware Security</Text>

                {/* SECURITY CONFIG */}
                <View style={styles.configContainer}>
                    <View style={styles.configRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.configTitle}>Attempt Lockout</Text>
                            <Text style={styles.configDesc}>Disable scanner for 5 mins after 5 failed tries</Text>
                        </View>
                        <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#A1A1AA" />
                    </View>
                </View>
            </ScrollView>

            {/* ENROLLMENT WIZARD MODAL */}
            <Modal visible={isWizardOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>

                        {/* Step indicator */}
                        <View style={styles.stepIndicator}>
                            {(["label", "scanning", "done"] as EnrollStep[]).map((s, i) => (
                                <View key={s} style={styles.stepRow}>
                                    <View style={[styles.stepDot, enrollStep === s && styles.stepDotActive,
                                        (enrollStep === "scanning" && i === 0) && styles.stepDotDone,
                                        (enrollStep === "done" && i < 2) && styles.stepDotDone]}>
                                        {((enrollStep === "scanning" && i === 0) || (enrollStep === "done" && i < 2)) ? (
                                            <MaterialCommunityIcons name="check" size={12} color="#050505" />
                                        ) : (
                                            <Text style={[styles.stepNum, enrollStep === s && styles.stepNumActive]}>{i + 1}</Text>
                                        )}
                                    </View>
                                    {i < 2 && <View style={styles.stepLine} />}
                                </View>
                            ))}
                        </View>

                        {/* Step 1: Label */}
                        {enrollStep === "label" && (
                            <>
                                <Text style={styles.modalTitle}>Name This Fingerprint</Text>
                                <Text style={styles.modalSubtitle}>Give this key a recognizable label.</Text>
                                {enrollError !== "" && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorText}>{enrollError}</Text>
                                    </View>
                                )}
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Right index finger"
                                    placeholderTextColor="#71717A"
                                    value={enrollLabel}
                                    onChangeText={(t) => { setEnrollLabel(t); setEnrollError(""); }}
                                    autoFocus
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={closeWizard}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmBtn} onPress={proceedToScan}>
                                        <Text style={styles.confirmBtnText}>Next →</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* Step 2: Scanning */}
                        {enrollStep === "scanning" && (
                            <>
                                <Text style={styles.modalTitle}>Place Your Finger</Text>
                                <Text style={styles.modalSubtitle}>Hold still on the fingerprint sensor…</Text>
                                <View style={styles.scanArea}>
                                    <Animated.View style={[styles.scanRing, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }]} />
                                    <View style={styles.scanCenter}>
                                        <MaterialCommunityIcons name="fingerprint" size={56} color="#10B981" />
                                    </View>
                                </View>
                                <Text style={styles.scanHint}>Scanning in progress…</Text>
                            </>
                        )}

                        {/* Step 3: Done */}
                        {enrollStep === "done" && (
                            <>
                                <Text style={styles.modalTitle}>Scan Complete!</Text>
                                <Text style={styles.modalSubtitle}>"{enrollLabel}" is ready to save.</Text>
                                <View style={styles.successIcon}>
                                    <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
                                </View>
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={closeWizard}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmBtn} onPress={saveEnrollment} disabled={enrollSaving}>
                                        {enrollSaving
                                            ? <ActivityIndicator color="#050505" />
                                            : <Text style={styles.confirmBtnText}>Save</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                    </View>
                </View>
            </Modal>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#050505" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
    headerTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "700" },
    backButton: { padding: 12 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionLabel: { color: "#71717A", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, marginTop: 32 },
    registerCard: { width: '100%', backgroundColor: "#10B98110", borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#10B98130' },
    registerIconWrapper: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#10B98120', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    registerTitle: { color: "#10B981", fontSize: 16, fontWeight: "700" },
    registerDesc: { color: "#10B98180", fontSize: 13, marginTop: 2 },
    emptyState: { padding: 24, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#27272A', borderRadius: 20 },
    emptyStateText: { color: '#3F3F46', fontSize: 14, fontWeight: '500' },
    printCard: { width: '100%', backgroundColor: "#09090B", borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#18181B', marginBottom: 12 },
    printInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    printIconSmall: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center' },
    printLabelText: { color: "#FAFAFA", fontSize: 15, fontWeight: "600" },
    printOwnerText: { color: "#71717A", fontSize: 12, marginTop: 2 },
    deleteBtn: { padding: 14, marginLeft: 8 },
    configContainer: { backgroundColor: "#09090B", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#18181B' },
    configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    configTitle: { color: "#FAFAFA", fontSize: 15, fontWeight: "700" },
    configDesc: { color: "#71717A", fontSize: 12, marginTop: 4, paddingRight: 30, lineHeight: 18 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: "#111111", borderRadius: 28, padding: 28, borderWidth: 1, borderColor: "#1F1F1F" },
    // Step indicator
    stepIndicator: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 24, gap: 0 },
    stepRow: { flexDirection: "row", alignItems: "center" },
    stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#18181B", borderWidth: 1, borderColor: "#27272A", justifyContent: "center", alignItems: "center" },
    stepDotActive: { borderColor: "#10B981", backgroundColor: "#10B98120" },
    stepDotDone: { backgroundColor: "#10B981", borderColor: "#10B981" },
    stepNum: { color: "#71717A", fontSize: 12, fontWeight: "700" },
    stepNumActive: { color: "#10B981" },
    stepLine: { width: 32, height: 1, backgroundColor: "#27272A" },
    // Modal content
    modalTitle: { color: "#FAFAFA", fontSize: 20, fontWeight: "700", textAlign: 'center' },
    modalSubtitle: { color: "#71717A", fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    input: { backgroundColor: "#050505", height: 56, borderRadius: 12, color: "#FAFAFA", paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: "#27272A" },
    errorBox: { backgroundColor: '#EF444415', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#EF444430' },
    errorText: { color: '#EF4444', fontSize: 13 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { color: "#71717A", fontWeight: "600", fontSize: 15 },
    confirmBtn: { flex: 1, height: 50, backgroundColor: "#FAFAFA", borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: "#050505", fontWeight: "700", fontSize: 15 },
    // Scan step
    scanArea: { alignItems: "center", justifyContent: "center", height: 160, marginVertical: 16 },
    scanRing: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "#10B98130", borderWidth: 2, borderColor: "#10B981" },
    scanCenter: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#10B98115", justifyContent: "center", alignItems: "center" },
    scanHint: { color: "#71717A", fontSize: 14, textAlign: "center", marginBottom: 16 },
    successIcon: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
});
    headerTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "bold" },
    backButton: { padding: 12 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionLabel: { color: "#71717A", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", marginBottom: 16, marginTop: 32 },
    
    // Register Card
    registerCard: { 
        width: '100%',
        backgroundColor: "#10B98110", 
        borderRadius: 24, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#10B98130',
        zIndex: 10
    },
    registerIconWrapper: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#10B98120', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    registerTitle: { color: "#10B981", fontSize: 18, fontWeight: "bold" },
    registerDesc: { color: "#10B98180", fontSize: 13, marginTop: 2 },

    // Empty State
    emptyState: { padding: 24, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#27272A', borderRadius: 20 },
    emptyStateText: { color: '#3F3F46', fontSize: 14, fontWeight: '500' },

    // Print Cards
    printCard: { 
        width: '100%',
        backgroundColor: "#09090B", 
        borderRadius: 20, 
        padding: 16, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#18181B',
        marginBottom: 12,
        zIndex: 5
    },
    printInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    printIconSmall: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center' },
    printLabelText: { color: "#FAFAFA", fontSize: 16, fontWeight: "600" },
    printOwnerText: { color: "#71717A", fontSize: 12, marginTop: 2 },
    deleteBtn: { padding: 14, marginLeft: 8, zIndex: 10 },

    // Config Section
    configContainer: { backgroundColor: "#09090B", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#18181B' },
    configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    configTitle: { color: "#FAFAFA", fontSize: 15, fontWeight: "bold" },
    configDesc: { color: "#71717A", fontSize: 12, marginTop: 4, paddingRight: 30, lineHeight: 18 }
});
