import styles from '@/src/pages/settings/styles';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useBLE } from '@/src/context/ble-context';
import { AppContext } from '@/src/context/app-context';
import { API_BASE_URL } from '@/src/config';

const DEVICE_WS_URL = API_BASE_URL.replace(/^https?:\/\//, 'wss://').replace(/\/$/, '');

export default function AddDeviceScreen() {
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
        readLockState,
    } = useBLE();
    const { authToken, setDeviceId } = useContext(AppContext);

    const [step, setStep] = useState(1);
    const [wifiNetwork, setWifiNetwork] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [deviceName, setDeviceName] = useState('');

    // Captured from BLE during Step 2
    const [capturedDeviceId, setCapturedDeviceId] = useState<string | null>(null);
    const [capturedPairingCode, setCapturedPairingCode] = useState<string | null>(null);

    const [scanning, setScanning] = useState(false);
    const [sending, setSending] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);

    // Start BLE scan when entering Step 1
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

    // Auto-advance to Step 2 when a device connects
    useEffect(() => {
        if (connectedDevice && step === 1) {
            stopScan();
            setScanning(false);
            // The BLE device name IS the deviceId (e.g. "smartlock_1A2B3C4D")
            const bleDeviceId = (connectedDevice.name || connectedDevice.localName || '').trim();
            if (bleDeviceId) {
                setCapturedDeviceId(bleDeviceId);
            }
            setStep(2);
        }
    }, [connectedDevice, step]);

    const namedDevices = allDevices.filter((d: any) => {
        const name = (d.name || '').trim() || (d.localName || '').trim();
        return Boolean(name);
    });

    const handleConnect = (device: any) => {
        connectToDevice(device);
    };

    const handleSendWifi = async () => {
        if (!wifiNetwork.trim()) return;
        setSending(true);

        // Send WiFi credentials + backend URL via BLE
        await sendCommand(
            JSON.stringify({
                ssid: wifiNetwork.trim(),
                password: wifiPassword,
                backendBaseUrl: DEVICE_WS_URL,
            }),
            connectedDevice,
        );

        // Read the pairing code from the state characteristic
        // The ESP32 writes JSON { "deviceId": "...", "pairingCode": "..." } to it
        try {
            const stateData = await readLockState(connectedDevice);
            if (stateData) {
                try {
                    const parsed = JSON.parse(stateData);
                    if (parsed.pairingCode) {
                        setCapturedPairingCode(parsed.pairingCode);
                    }
                    if (parsed.deviceId && !capturedDeviceId) {
                        setCapturedDeviceId(parsed.deviceId);
                    }
                } catch {
                    // If the state char returns a plain string, use it as pairing code
                    if (stateData.trim().length > 0) {
                        setCapturedPairingCode(stateData.trim());
                    }
                }
            }
        } catch (e) {
            console.log('[AddDevice] Could not read state characteristic:', e);
        }

        setSending(false);
        setStep(3);
    };

    const handleFinishSetup = async () => {
        setStep(4);
        setClaiming(true);
        setClaimError(null);

        if (!capturedDeviceId || !capturedPairingCode) {
            setClaimError('Missing device ID or pairing code from hardware.');
            setClaiming(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}devices/${capturedDeviceId}/claim`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                    },
                    body: JSON.stringify({ pairingCode: capturedPairingCode }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Claim failed (${response.status})`);
            }

            // Claim succeeded — update global device state
            setDeviceId(capturedDeviceId);

            // Disconnect BLE (device has already rebooted to WiFi mode)
            disconnectFromDevice(connectedDevice?.id);
        } catch (e: any) {
            console.error('[AddDevice] Claim error:', e);
            setClaimError(e.message || 'Failed to claim device.');
        } finally {
            setClaiming(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={[styles.container, styles.flex1]}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add a New Device</Text>
                    <Text style={styles.subtitle}>Step {step} of 4</Text>
                </View>

                <View style={styles.flex1}>
                    {/* ── STEP 1: SCAN & CONNECT ── */}
                    {step === 1 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Power On & Connect</Text>
                            <Text style={styles.stepDescription}>
                                Insert the batteries into your smart lock. Wait until the LED
                                blinks blue, then tap a device below to connect.
                            </Text>

                            {scanning && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                                    <ActivityIndicator size="small" color="#2563eb" />
                                    <Text style={styles.stepDescription}>Scanning for devices…</Text>
                                </View>
                            )}

                            {namedDevices.map((device: any) => (
                                <TouchableOpacity
                                    key={device.id}
                                    style={[styles.card, { marginTop: 8 }]}
                                    onPress={() => handleConnect(device)}
                                >
                                    <Text style={styles.rowTitle}>
                                        {device.name || device.localName || 'Unnamed'}
                                    </Text>
                                    <Text style={styles.rowSubtitle}>{device.id}</Text>
                                </TouchableOpacity>
                            ))}

                            {namedDevices.length === 0 && !scanning && (
                                <Text style={[styles.stepDescription, { marginTop: 16 }]}>
                                    No devices found. Make sure the lock is in pairing mode.
                                </Text>
                            )}
                        </View>
                    )}

                    {/* ── STEP 2: WI-FI PROVISIONING ── */}
                    {step === 2 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Connect to Wi-Fi</Text>
                            <Text style={styles.stepDescription}>
                                Enter your 2.4GHz Wi-Fi credentials to connect the device to
                                your network.
                            </Text>
                            {capturedDeviceId && (
                                <Text style={[styles.stepDescription, { color: '#10B981' }]}>
                                    Connected: {capturedDeviceId}
                                </Text>
                            )}
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Wi-Fi Network Name"
                                    placeholderTextColor="#71717A"
                                    value={wifiNetwork}
                                    onChangeText={setWifiNetwork}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#71717A"
                                    secureTextEntry
                                    value={wifiPassword}
                                    onChangeText={setWifiPassword}
                                />
                            </View>
                        </View>
                    )}

                    {/* ── STEP 3: NAME DEVICE ── */}
                    {step === 3 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Name Your Device</Text>
                            <Text style={styles.stepDescription}>
                                Give this device a recognizable name (e.g., "Front Door").
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Device Name"
                                placeholderTextColor="#71717A"
                                value={deviceName}
                                onChangeText={setDeviceName}
                            />
                        </View>
                    )}

                    {/* ── STEP 4: CLAIMING & SUCCESS ── */}
                    {step === 4 && (
                        <View style={styles.successContainer}>
                            {claiming ? (
                                <>
                                    <ActivityIndicator size="large" color="#2563eb" />
                                    <Text style={styles.stepTitle}>Claiming Device…</Text>
                                    <Text style={styles.stepDescription}>
                                        Registering your smart lock with the server.
                                    </Text>
                                </>
                            ) : claimError ? (
                                <>
                                    <Text style={[styles.successIcon, { fontSize: 64 }]}>!</Text>
                                    <Text style={[styles.successTitle, { color: '#EF4444' }]}>
                                        Claim Failed
                                    </Text>
                                    <Text style={styles.stepDescription}>{claimError}</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.successIcon}>✓</Text>
                                    <Text style={styles.successTitle}>Setup Complete!</Text>
                                    <Text style={styles.stepDescription}>
                                        Your device is now connected and ready to secure your home.
                                    </Text>
                                </>
                            )}
                        </View>
                    )}
                </View>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                    {step > 1 && step < 4 ? (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonGhost, styles.flex1]}
                            onPress={prevStep}
                        >
                            <Text style={[styles.buttonText, styles.buttonGhostText]}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.flex1} />
                    )}

                    {step === 1 ? (
                        // Step 1: no next button, user taps a device to connect
                        <View style={styles.flex1} />
                    ) : step === 2 ? (
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonPrimary,
                                styles.flex1,
                                (!wifiNetwork.trim() || sending) && { opacity: 0.4 },
                            ]}
                            onPress={handleSendWifi}
                            disabled={!wifiNetwork.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonPrimaryText}>Send & Continue</Text>
                            )}
                        </TouchableOpacity>
                    ) : step === 3 ? (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSuccess, styles.flex1]}
                            onPress={handleFinishSetup}
                        >
                            <Text style={styles.buttonPrimaryText}>Finish Setup</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonPrimary, styles.flex1]}
                            onPress={() => {
                                if (claimError) {
                                    // Allow retry
                                    handleFinishSetup();
                                } else {
                                    router.replace('/');
                                }
                            }}
                        >
                            <Text style={styles.buttonPrimaryText}>
                                {claimError ? 'Retry' : 'Go Home'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
