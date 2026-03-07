import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
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
    const [livenessDetection, setLivenessDetection] = useState(true);

    const [prints, setPrints] = useState<FingerprintProfile[]>([
        { id: "1", label: "Right Thumb", owner: "Benji (Me)", dateAdded: "Feb 12, 2026" },
        { id: "2", label: "Left Index", owner: "Benji (Me)", dateAdded: "Feb 12, 2026" },
        { id: "3", label: "Right Thumb", owner: "Sarah", dateAdded: "Mar 01, 2026" },
    ]);

    const handleRemovePrint = (label: string, owner: string) => {
        Alert.alert(
            "Remove Fingerprint",
            `Are you sure you want to delete ${owner}'s ${label}?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Remove", 
                    style: "destructive",
                    onPress: () => console.log("Deleted") 
                }
            ]
        );
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

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* REGISTER NEW PRINT */}
                <TouchableOpacity style={styles.registerCard} activeOpacity={0.8}>
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

                {/* FINGERPRINT LIST */}
                {prints.map((print) => (
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
                            onPress={() => handleRemovePrint(print.label, print.owner)}
                            style={styles.deleteBtn}
                        >
                            <MaterialCommunityIcons name="minus-circle-outline" size={22} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))}

                <Text style={styles.sectionLabel}>Hardware Security</Text>

                {/* SECURITY CONFIG */}
                <View style={styles.configContainer}>
                    <View style={styles.configRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.configTitle}>Liveness Detection</Text>
                            <Text style={styles.configDesc}>Prevents spoofing via high-res latent print rejection</Text>
                        </View>
                        <Switch 
                            value={livenessDetection}
                            onValueChange={setLivenessDetection}
                            trackColor={{ false: "#27272A", true: "#10B98150" }}
                            thumbColor={livenessDetection ? "#10B981" : "#71717A"}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.configRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.configTitle}>Attempt Lockout</Text>
                            <Text style={styles.configDesc}>Disable scanner for 5 mins after 5 failed tries</Text>
                        </View>
                        <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#A1A1AA" />
                    </View>
                </View>

                {/* SENSOR HEALTH */}
                <View style={styles.healthBox}>
                    <View style={styles.healthHeader}>
                        <Text style={styles.healthTitle}>Scanner Health</Text>
                        <Text style={styles.healthStatus}>Optimal</Text>
                    </View>
                    <View style={styles.healthBarTrack}>
                        <View style={[styles.healthBarFill, { width: '98%' }]} />
                    </View>
                    <Text style={styles.healthFooter}>Last cleaned/calibrated: 2 days ago</Text>
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
    
    // Register Card
    registerCard: { 
        backgroundColor: "#10B98110", 
        borderRadius: 24, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#10B98130' 
    },
    registerIconWrapper: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#10B98120', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    registerTitle: { color: "#10B981", fontSize: 18, fontWeight: "bold" },
    registerDesc: { color: "#10B98180", fontSize: 13, marginTop: 2 },

    // Print Cards
    printCard: { 
        backgroundColor: "#09090B", 
        borderRadius: 20, 
        padding: 16, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#18181B',
        marginBottom: 12
    },
    printInfo: { flexDirection: 'row', alignItems: 'center' },
    printIconSmall: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center' },
    printLabelText: { color: "#FAFAFA", fontSize: 16, fontWeight: "600" },
    printOwnerText: { color: "#71717A", fontSize: 12, marginTop: 2 },
    deleteBtn: { padding: 8 },

    // Config Section
    configContainer: { backgroundColor: "#09090B", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#18181B' },
    configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    configTitle: { color: "#FAFAFA", fontSize: 15, fontWeight: "bold" },
    configDesc: { color: "#71717A", fontSize: 12, marginTop: 4, paddingRight: 30, lineHeight: 18 },
    divider: { height: 1, backgroundColor: '#18181B', marginVertical: 20 },

    // Health Box
    healthBox: { marginTop: 40, backgroundColor: '#09090B', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#18181B' },
    healthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    healthTitle: { color: '#71717A', fontSize: 13, fontWeight: 'bold' },
    healthStatus: { color: '#10B981', fontSize: 13, fontWeight: 'bold' },
    healthBarTrack: { width: '100%', height: 4, backgroundColor: '#18181B', borderRadius: 2, marginBottom: 12 },
    healthBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
    healthFooter: { color: '#3F3F46', fontSize: 11, textAlign: 'center' }
});