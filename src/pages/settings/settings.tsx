import { AppContext } from "@/src/context/app-context";
import { useSettings } from "@/src/hooks/useSettings";
import SigninForm from "@/src/pages/settings/signInForm";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";

export default function Settings() {
    const { user, deviceId, signout, isDeviceConnected } = useContext(AppContext);
    const router = useRouter();
    const { settings, loading, error, updatingKeys, updateSetting, refetch } = useSettings();
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);

    useFocusEffect(() => {
        refetch();
    });

    const handleToggle = async (key: keyof typeof settings, value: boolean) => {
        setSettingsError(null);
        try {
            await updateSetting(key, value);
        } catch (e: any) {
            setSettingsError(e.message || "Failed to update setting");
        }
    };

    const handleRetry = async () => {
        setRetrying(true);
        setSettingsError(null);
        await refetch();
        setRetrying(false);
    };

    const isOffline = !!error;

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#050505" }}>
                <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
                    <SigninForm />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>System Settings</Text>
                    <Text style={styles.subtitle}>Manage your smart doorbell and locks</Text>
                </View>

                <View style={{ gap: 24 }}>
                    
                    {/* Connected Devices */}
                    <View>
                        <Text style={styles.sectionTitle}>Connected Devices</Text>
                        
                        <View style={[styles.card, styles.divide]}>
                            <SettingLink
                                icon="lock-smart"
                                title="Front Door Lock"
                                subtitle={`ID: ${deviceId || "—"}`}
                                rightContent={
                                    <Text style={[styles.badge, isDeviceConnected ? styles.badgeSolid : styles.badgeOutline]}>
                                        {isDeviceConnected ? "Online" : "Offline"}
                                    </Text>
                                }
                                onPress={() => router.push("/settings/device-config")}
                            />
                            
                            <SettingLink
                                icon="plus-circle-outline"
                                title="Add a Device"
                                subtitle="Pair a new smart doorbell or lock"
                                onPress={() => router.push("/settings/add-device")}
                            />
                        </View>
                    </View>

                    {/* Security & Access */}
                    <View>
                        <Text style={styles.sectionTitle}>Security & Access</Text>
                        <View style={[styles.card, styles.divide]}>
                            <SettingLink
                                icon="face-recognition"
                                title="Face ID Profiles"
                                subtitle="Enroll or remove face access"
                                onPress={() => router.push("/sensors/facial-settings")}
                            />
                            <SettingLink
                                icon="fingerprint"
                                title="Biometrics"
                                subtitle="Manage fingerprint settings"
                                onPress={() => router.push("/sensors/biometric-settings")}
                            />
                            <SettingLink
                                icon="dialpad"
                                title="PIN Code Management"
                                subtitle="Master, permanent, and one-time PINs"
                                onPress={() => router.push("/sensors/pin-settings")}
                            />
                            <SettingLink
                                icon="walk"
                                title="Motion Detection"
                                subtitle="Configure zones and sensitivity"
                                onPress={() => router.push("/sensors/motion-settings")}
                            />
                        </View>
                    </View>

                    {/* Account & System */}
                    <View>
                        <Text style={styles.sectionTitle}>Account & System</Text>
                        
                        <View style={[styles.card, { marginBottom: 16 }]}>
                            <View style={styles.profileRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{`${user?.firstName[0]}${user?.lastName[0]}`}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileName}>{`${user?.firstName} ${user?.lastName}`}</Text>
                                    <Text style={styles.profileEmail}>{`${user?.email}`}</Text>
                                </View>
                            </View>
                        </View>

                        {loading ? (
                            <View style={[styles.card, { alignItems: "center", paddingVertical: 32 }]}>
                                <ActivityIndicator size="small" color="#FAFAFA" />
                                <Text style={[styles.rowSubtitle, { marginTop: 12 }]}>Loading settings...</Text>
                            </View>
                        ) : (
                            <>
                                {isOffline && (
                                    <View style={styles.offlineBanner}>
                                        <Text style={styles.offlineBannerText}>{error}</Text>
                                        <TouchableOpacity
                                            onPress={handleRetry}
                                            style={styles.offlineUpdateButton}
                                            disabled={retrying}
                                        >
                                            {retrying ? (
                                                <ActivityIndicator size="small" color="#EF4444" />
                                            ) : (
                                                <Text style={styles.offlineUpdateButtonText}>Retry</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={[styles.card, styles.divide]}>
                                    <SettingLink
                                        icon="account-group-outline"
                                        title="Manage Users"
                                        subtitle="Users with app access"
                                        onPress={() => router.push("/settings/manage-users")}
                                    />
                                    <SettingLink
                                        icon="history"
                                        title="Security Logs"
                                        subtitle="View access and privacy history"
                                        onPress={() => router.push("/settings/security-privacy")}
                                    />
                                    <SettingToggle
                                        icon="bell-outline"
                                        title="Notifications"
                                        subtitle="Push alerts for events"
                                        value={settings.notisEnabled}
                                        onValueChange={(v) => handleToggle("notisEnabled", v)}
                                        updating={updatingKeys.has("notisEnabled")}
                                        disabled={isOffline}
                                    />
                                </View>
                            </>
                        )}
                        {settingsError && (
                            <Text style={{ color: "#EF4444", fontSize: 13, marginTop: 8, marginLeft: 4 }}>
                                {settingsError}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.buttonGhost} onPress={signout} activeOpacity={0.7}>
                        <Text style={styles.buttonGhostText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- Subcomponents ---

type SettingToggleProps = {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    updating?: boolean;
    disabled?: boolean;
};

const SettingToggle = ({ icon, title, subtitle, value, onValueChange, updating, disabled }: SettingToggleProps) => (
    <View style={[styles.settingToggleRow, disabled && { opacity: 0.5 }]}>
        <View style={styles.rowCenter}>
            <IconCircle name={icon} />
            <View style={{ flexShrink: 1 }}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
        </View>
        {updating ? (
            <ActivityIndicator size="small" color="#A1A1AA" />
        ) : (
            <Switch 
                value={value} 
                onValueChange={onValueChange} 
                disabled={disabled}
                trackColor={{ false: '#27272A', true: '#10B981' }}
                thumbColor={'#FAFAFA'}
            />
        )}
    </View>
);

type SettingLinkProps = {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    subtitle: string;
    rightContent?: React.ReactNode;
    onPress?: () => void;
};

const SettingLink = ({ icon, title, subtitle, rightContent, onPress }: SettingLinkProps) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.linkRow} onPress={onPress}>
        <View style={styles.rowCenter}>
            <IconCircle name={icon} />
            <View>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
        </View>
        {rightContent ? rightContent : <MaterialCommunityIcons name="chevron-right" size={24} color="#3F3F46" />}
    </TouchableOpacity>
);

const IconCircle = ({ name }: { name: keyof typeof MaterialCommunityIcons.glyphMap }) => (
    <View style={styles.circleIcon}>
        <MaterialCommunityIcons name={name} size={22} color="#A1A1AA" />
    </View>
);