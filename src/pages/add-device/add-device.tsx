import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useBLE } from "@/src/context/ble-context";
import { useWifiScan } from "@/src/hooks/useWifiScan";
import { API_BASE_URL } from "@/src/config";

// Convert the HTTPS API base URL to a WSS URL for the ESP32 WebSocket connection
const DEVICE_WS_URL = API_BASE_URL.replace(/^https?:\/\//, "wss://").replace(/\/$/, "");

type Step = "scan" | "wifi" | "done";

export default function AddDevice() {
    const router = useRouter();
    const {
        allDevices,
        connectedDevice,
        connectToDevice,
        disconnectFromDevice,
        requestPermissions,
        scanForPeripherals,
        stopScan,
        resetDevices,
        sendCommand,
    } = useBLE();

    const { networks: wifiNetworks, scanning: wifiScanning, scan: scanWifi } = useWifiScan();

    const [step,         setStep]      = useState<Step>("scan");
    const [scanning,     setScanning]  = useState(false);
    const [ssid,         setSsid]      = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [sending,      setSending]   = useState(false);
    const [manualEntry,  setManualEntry] = useState(false);

    // Start BLE scan on mount
    useEffect(() => {
        let cancelled = false;
        const start = async () => {
            const ok = await requestPermissions();
            if (!ok || cancelled) return;
            resetDevices();
            setScanning(true);
            scanForPeripherals();
        };
        start();
        return () => {
            cancelled = true;
            stopScan();
            setScanning(false);
        };
    }, []);

    // Advance to WiFi step once a device connects
    useEffect(() => {
        if (connectedDevice && step === "scan") {
            stopScan();
            setScanning(false);
            setStep("wifi");
        }
    }, [connectedDevice, step]);

    // Scan for WiFi networks when entering the WiFi step
    useEffect(() => {
        if (step === "wifi") {
            scanWifi();
        }
    }, [step]);

    const namedDevices = allDevices.filter((d) => {
        const name = (d.name || "").trim() || (d.localName || "").trim();
        return Boolean(name);
    });

    const handleConnect = (device: any) => {
        connectToDevice(device);
    };

    const handleSendWifi = async () => {
        if (!ssid.trim()) return;
        setSending(true);
        // Send WiFi credentials and the cloud backend URL in a single BLE write.
        // The device will save both, mark itself as provisioned, and switch to WiFi mode.
        await sendCommand(
            JSON.stringify({
                ssid: ssid.trim(),
                password: wifiPassword,
                backendBaseUrl: DEVICE_WS_URL,
            }),
            connectedDevice,
        );
        setSending(false);
        setStep("done");
    };

    const stepIndex = { scan: 0, wifi: 1, done: 2 }[step];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FAFAFA" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add a Device</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Step indicator */}
            <View style={styles.stepRow}>
                {["Scan", "Wi-Fi", "Done"].map((label, i) => (
                    <React.Fragment key={i}>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}>
                                {i < stepIndex ? (
                                    <MaterialCommunityIcons name="check" size={14} color="#050505" />
                                ) : (
                                    <Text style={[styles.stepDotText, i === stepIndex && styles.stepDotTextActive]}>
                                        {i + 1}
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.stepLabel, i === stepIndex && styles.stepLabelActive]}>
                                {label}
                            </Text>
                        </View>
                        {i < 2 && <View style={[styles.stepLine, i < stepIndex && styles.stepLineActive]} />}
                    </React.Fragment>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── STEP 1: SCAN ── */}
                {step === "scan" && (
                    <>
                        <View style={styles.infoCard}>
                            <MaterialCommunityIcons name="bluetooth-connect" size={40} color="#3B82F6" />
                            <Text style={styles.infoTitle}>Looking for devices</Text>
                            <Text style={styles.infoSubtitle}>
                                Make sure your smart lock is powered on and in pairing mode.
                            </Text>
                        </View>

                        {scanning && (
                            <View style={styles.scanningRow}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text style={styles.scanningText}>Scanning for nearby devices…</Text>
                            </View>
                        )}

                        {namedDevices.length === 0 && !scanning && (
                            <View style={styles.emptyDevices}>
                                <Text style={styles.emptyDevicesText}>No devices found</Text>
                            </View>
                        )}

                        {namedDevices.map((device) => (
                            <TouchableOpacity
                                key={device.id}
                                style={styles.deviceCard}
                                activeOpacity={0.7}
                                onPress={() => handleConnect(device)}
                            >
                                <View style={styles.deviceLeft}>
                                    <View style={styles.deviceIcon}>
                                        <MaterialCommunityIcons name="lock" size={20} color="#3B82F6" />
                                    </View>
                                    <View>
                                        <Text style={styles.deviceName}>
                                            {device.name || device.localName || "Unnamed"}
                                        </Text>
                                        <Text style={styles.deviceId} numberOfLines={1}>{device.id}</Text>
                                    </View>
                                </View>
                                <View style={styles.connectBtn}>
                                    <Text style={styles.connectBtnText}>Connect</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* ── STEP 2: WI-FI ── */}
                {step === "wifi" && (
                    <>
                        <View style={styles.connectedBanner}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                            <Text style={styles.connectedText}>
                                Connected to {connectedDevice?.name || connectedDevice?.id}
                            </Text>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Wi-Fi Configuration</Text>
                            <Text style={styles.formSubtitle}>
                                {ssid
                                    ? `Selected: ${ssid}`
                                    : "Select your Wi-Fi network from the list below."}
                            </Text>

                            {/* Network list (Android) or manual fallback (iOS/web) */}
                            {!ssid && !manualEntry && (
                                <>
                                    {wifiScanning && (
                                        <View style={styles.scanningRow}>
                                            <ActivityIndicator size="small" color="#3B82F6" />
                                            <Text style={styles.scanningText}>Scanning for networks…</Text>
                                        </View>
                                    )}

                                    {!wifiScanning && wifiNetworks.length === 0 && (
                                        <Text style={[styles.formSubtitle, { marginTop: 4 }]}>
                                            {Platform.OS === "android"
                                                ? "No networks found. Tap Rescan or enter manually."
                                                : "Wi-Fi scanning is not available on this platform. Please enter your network name manually."}
                                        </Text>
                                    )}

                                    {wifiNetworks.map((net) => (
                                        <TouchableOpacity
                                            key={net.SSID}
                                            style={styles.networkCard}
                                            activeOpacity={0.7}
                                            onPress={() => setSsid(net.SSID)}
                                        >
                                            <View style={styles.networkLeft}>
                                                <MaterialCommunityIcons name="wifi" size={20} color="#3B82F6" />
                                                <Text style={styles.networkName}>{net.SSID}</Text>
                                            </View>
                                            {net.level != null && (
                                                <Text style={styles.networkSignal}>
                                                    {net.level > -50 ? "Strong" : net.level > -70 ? "Good" : "Weak"}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}

                                    <View style={styles.wifiActions}>
                                        {Platform.OS === "android" && (
                                            <TouchableOpacity onPress={scanWifi} style={styles.linkBtn}>
                                                <MaterialCommunityIcons name="refresh" size={16} color="#3B82F6" />
                                                <Text style={styles.linkBtnText}>Rescan</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => setManualEntry(true)} style={styles.linkBtn}>
                                            <MaterialCommunityIcons name="pencil" size={16} color="#3B82F6" />
                                            <Text style={styles.linkBtnText}>Enter manually</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            {/* Manual SSID entry fallback */}
                            {!ssid && manualEntry && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Network Name (SSID)</Text>
                                    <TextInput
                                        style={styles.input}
                                        onChangeText={(text) => { if (text.trim()) setSsid(text.trim()); }}
                                        onSubmitEditing={(e) => { if (e.nativeEvent.text.trim()) setSsid(e.nativeEvent.text.trim()); }}
                                        placeholder="e.g. MyHomeWifi"
                                        placeholderTextColor="#3F3F46"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity onPress={() => setManualEntry(false)} style={styles.linkBtn}>
                                        <Text style={styles.linkBtnText}>Back to list</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Password + send (shown after SSID is chosen) */}
                            {!!ssid && (
                                <>
                                    <TouchableOpacity onPress={() => setSsid("")} style={styles.linkBtn}>
                                        <Text style={styles.linkBtnText}>Change network</Text>
                                    </TouchableOpacity>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={wifiPassword}
                                            onChangeText={setWifiPassword}
                                            placeholder="Wi-Fi password"
                                            placeholderTextColor="#3F3F46"
                                            secureTextEntry
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.primaryBtn, sending && styles.primaryBtnDisabled]}
                                        onPress={handleSendWifi}
                                        disabled={sending}
                                        activeOpacity={0.8}
                                    >
                                        {sending ? (
                                            <ActivityIndicator size="small" color="#050505" />
                                        ) : (
                                            <Text style={styles.primaryBtnText}>Send to Device</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </>
                )}

                {/* ── STEP 3: DONE ── */}
                {step === "done" && (
                    <View style={styles.doneCard}>
                        <View style={styles.doneIcon}>
                            <MaterialCommunityIcons name="check" size={48} color="#10B981" />
                        </View>
                        <Text style={styles.doneTitle}>Device Configured</Text>
                        <Text style={styles.doneSubtitle}>
                            Your smart lock has received its Wi-Fi and server settings. It will connect automatically within a few seconds.
                        </Text>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => { disconnectFromDevice(connectedDevice?.id); router.back(); }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryBtnText}>Back to Settings</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
    // Step indicator
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    stepItem: {
        alignItems: "center",
        gap: 4,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#18181B",
        borderWidth: 1,
        borderColor: "#27272A",
        justifyContent: "center",
        alignItems: "center",
    },
    stepDotActive: {
        backgroundColor: "#FAFAFA",
        borderColor: "#FAFAFA",
    },
    stepDotText: {
        color: "#71717A",
        fontSize: 12,
        fontWeight: "700",
    },
    stepDotTextActive: {
        color: "#050505",
    },
    stepLabel: {
        color: "#71717A",
        fontSize: 10,
        fontWeight: "600",
    },
    stepLabelActive: {
        color: "#FAFAFA",
    },
    stepLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#18181B",
        marginBottom: 16,
        marginHorizontal: 4,
    },
    stepLineActive: {
        backgroundColor: "#FAFAFA",
    },
    // Content
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 16,
    },
    infoCard: {
        backgroundColor: "#09090B",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#18181B",
        padding: 32,
        alignItems: "center",
        gap: 12,
    },
    infoTitle: {
        color: "#FAFAFA",
        fontSize: 20,
        fontWeight: "bold",
    },
    infoSubtitle: {
        color: "#71717A",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    scanningRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 4,
    },
    scanningText: {
        color: "#71717A",
        fontSize: 13,
    },
    emptyDevices: {
        alignItems: "center",
        paddingVertical: 24,
        backgroundColor: "#09090B",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#18181B",
    },
    emptyDevicesText: {
        color: "#3F3F46",
        fontSize: 14,
    },
    deviceCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#09090B",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#18181B",
        padding: 14,
    },
    deviceLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flexShrink: 1,
    },
    deviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#1e3a5f",
        justifyContent: "center",
        alignItems: "center",
    },
    deviceName: {
        color: "#FAFAFA",
        fontSize: 15,
        fontWeight: "600",
    },
    deviceId: {
        color: "#71717A",
        fontSize: 11,
        maxWidth: 200,
    },
    connectBtn: {
        backgroundColor: "#FAFAFA",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    connectBtnText: {
        color: "#050505",
        fontWeight: "700",
        fontSize: 13,
    },
    connectedBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#10B98115",
        borderWidth: 1,
        borderColor: "#10B98130",
        borderRadius: 12,
        padding: 12,
    },
    connectedText: {
        color: "#10B981",
        fontSize: 14,
        fontWeight: "600",
    },
    formCard: {
        backgroundColor: "#09090B",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#18181B",
        padding: 20,
        gap: 16,
    },
    formTitle: {
        color: "#FAFAFA",
        fontSize: 18,
        fontWeight: "bold",
    },
    formSubtitle: {
        color: "#71717A",
        fontSize: 13,
        lineHeight: 19,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        color: "#A1A1AA",
        fontSize: 13,
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#0A0A0A",
        borderWidth: 1,
        borderColor: "#27272A",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#FAFAFA",
    },
    primaryBtn: {
        backgroundColor: "#FAFAFA",
        height: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
    },
    primaryBtnDisabled: {
        opacity: 0.4,
    },
    primaryBtnText: {
        color: "#050505",
        fontSize: 16,
        fontWeight: "bold",
    },
    doneCard: {
        backgroundColor: "#09090B",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "#18181B",
        padding: 32,
        alignItems: "center",
        gap: 16,
    },
    doneIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#10B98115",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#10B98130",
    },
    doneTitle: {
        color: "#FAFAFA",
        fontSize: 24,
        fontWeight: "bold",
    },
    doneSubtitle: {
        color: "#71717A",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 22,
    },
    networkCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#09090B",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#18181B",
        padding: 14,
    },
    networkLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    networkName: {
        color: "#FAFAFA",
        fontSize: 15,
        fontWeight: "600",
    },
    networkSignal: {
        color: "#71717A",
        fontSize: 12,
    },
    wifiActions: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
        marginTop: 4,
    },
    linkBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    linkBtnText: {
        color: "#3B82F6",
        fontWeight: "600",
        fontSize: 14,
    },
});
