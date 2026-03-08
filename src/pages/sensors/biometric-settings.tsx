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
    TouchableOpacity,
    View
} from "react-native";

type FingerprintProfile = {
    id: string;
    label: string;
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#050505" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 },
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