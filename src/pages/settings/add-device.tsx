import styles from '@/src/pages/settings/styles'; // Importing your shared styles!
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddDeviceScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [wifiNetwork, setWifiNetwork] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [deviceName, setDeviceName] = useState('');

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add a New Device</Text>
                    <Text style={styles.subtitle}>Step {step} of 4</Text>
                </View>

                {/* Using flex: 1 to push the footer to the bottom */}
                <View style={styles.flex1}>
                    {step === 1 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Power On</Text>
                            <Text style={styles.stepDescription}>
                                Insert the batteries into your smart lock or plug in your doorbell. Wait until the LED indicator blinks blue, indicating it is ready to pair.
                            </Text>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Connect to Wi-Fi</Text>
                            <Text style={styles.stepDescription}>
                                Select your 2.4GHz Wi-Fi network and enter the password to connect the device to your system.
                            </Text>
                            <View style={styles.inputGroup}>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Wi-Fi Network Name" 
                                    value={wifiNetwork}
                                    onChangeText={setWifiNetwork}
                                />
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Password" 
                                    secureTextEntry
                                    value={wifiPassword}
                                    onChangeText={setWifiPassword}
                                />
                            </View>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Name Your Device</Text>
                            <Text style={styles.stepDescription}>
                                Give this device a recognizable name (e.g., "Backyard Door" or "Front Gate").
                            </Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Device Name" 
                                value={deviceName}
                                onChangeText={setDeviceName}
                            />
                        </View>
                    )}

                    {step === 4 && (
                        <View style={styles.successContainer}>
                            <Text style={styles.successIcon}>✅</Text>
                            <Text style={styles.successTitle}>Setup Complete!</Text>
                            <Text style={styles.stepDescription}>
                                Your device is now connected and ready to secure your home.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Footer Buttons using existing shared styles */}
                <View style={styles.footer}>
                    {step > 1 && step < 4 ? (
                        <TouchableOpacity style={[styles.button, styles.buttonGhost, styles.flex1]} onPress={prevStep}>
                            <Text style={styles.buttonText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.flex1} />
                    )}

                    {step < 3 ? (
                        <TouchableOpacity style={[styles.button, styles.buttonPrimary, styles.flex1]} onPress={nextStep}>
                            <Text style={styles.buttonPrimaryText}>Next</Text>
                        </TouchableOpacity>
                    ) : step === 3 ? (
                        <TouchableOpacity style={[styles.button, styles.buttonSuccess, styles.flex1]} onPress={nextStep}>
                            <Text style={styles.buttonPrimaryText}>Finish Setup</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.button, styles.buttonPrimary, styles.flex1]} onPress={() => router.back()}>
                            <Text style={styles.buttonPrimaryText}>Return to Settings</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}