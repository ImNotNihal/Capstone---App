import React, { ReactNode, useState, useContext, useCallback } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "./styles";
import { AppContext } from "@/src/context/app-context";
import { API_BASE_URL } from "@/src/config";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSettings } from "@/src/hooks/useSettings";
import { useTheme } from "@/src/context/theme-context";

export default function Settings() {
    const { user, deviceId, setDeviceId, signout, isDeviceConnected, authToken } = useContext(AppContext);
    const { isDark, toggleTheme, colors } = useTheme();
    const styles = createStyles(colors);
    const router = useRouter();
    const { settings, loading, error, updatingKeys, updateSetting, refetch } = useSettings();
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);
    const [forgetting, setForgetting] = useState(false);

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

    const handleForgetDevice = () => {
        Alert.alert(
            "Forget Device",
            "This will remove all ownership data and make the device available for a new owner. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Forget",
                    style: "destructive",
                    onPress: async () => {
                        if (!deviceId) return;
                        setForgetting(true);
                        try {
                            const headers: Record<string, string> = {};
                            if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
                            await fetch(`${API_BASE_URL}devices/${deviceId}/forget`, {
                                method: "DELETE",
                                headers,
                            });
                            setDeviceId(null);
                        } catch (e) {
                            console.warn("Forget device failed:", e);
                        } finally {
                            setForgetting(false);
                        }
                    },
                },
            ],
        );
    };

    const isOffline = !!error;
    const offlineStyles = makeOfflineStyles(colors);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Manage your security system</Text>
            </View>

            <View style={{ gap: 16 }}>
                {/* Profile */}
                {user && (
                    <View style={styles.card}>
                        <View style={styles.profileRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.profileName}>{`${user.firstName} ${user.lastName}`}</Text>
                                <Text style={styles.profileEmail}>{`${user.email}`}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Quick Settings */}
                <View>
                    <Text style={styles.sectionTitle}>Quick Settings</Text>
                    {loading ? (
                        <View style={[styles.card, { alignItems: "center", paddingVertical: 24 }]}>
                            <ActivityIndicator size="small" color="#2563eb" />
                            <Text style={[styles.rowSubtitle, { marginTop: 8 }]}>Loading settings...</Text>
                        </View>
                    ) : (
                        <>
                            {isOffline && (
                                <View style={offlineStyles.banner}>
                                    <Text style={offlineStyles.bannerText}>{error}</Text>
                                    <TouchableOpacity
                                        onPress={handleRetry}
                                        style={offlineStyles.updateButton}
                                        disabled={retrying}
                                    >
                                        {retrying ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={offlineStyles.updateButtonText}>Update</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={[styles.card, styles.divide]}>
                                <SettingToggle
                                    icon={<CircleIcon label="N" color="#2563eb" />}
                                    title="Notifications"
                                    subtitle="Push alerts for events"
                                    value={settings.notisEnabled}
                                    onValueChange={(v) => handleToggle("notisEnabled", v)}
                                    updating={updatingKeys.has("notisEnabled")}
                                    disabled={isOffline}
                                />

                                {/* Appearance toggle */}
                                <View style={styles.settingToggleRow}>
                                    <View style={styles.rowCenter}>
                                        <View style={[styles.circleIcon, { backgroundColor: "#71717A1a" }]}>
                                            <MaterialCommunityIcons
                                                name={isDark ? "weather-night" : "weather-sunny"}
                                                size={16}
                                                color="#71717A"
                                            />
                                        </View>
                                        <View style={{ flexShrink: 1 }}>
                                            <Text style={styles.rowTitle}>Appearance</Text>
                                            <Text style={styles.rowSubtitle}>{isDark ? "Dark mode" : "Light mode"}</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={isDark}
                                        onValueChange={toggleTheme}
                                        trackColor={{ false: "#27272A", true: "#2563eb" }}
                                        thumbColor="#FAFAFA"
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    {settingsError && (
                        <Text style={{ color: "#b91c1c", fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                            {settingsError}
                        </Text>
                    )}
                </View>

                {/* System */}
                <View>
                    <Text style={styles.sectionTitle}>System</Text>
                    <View style={[styles.card, styles.divide]}>
                        <SettingLink
                            icon={<CircleIcon label="U" color="#2563eb" />}
                            title="Manage Users"
                            subtitle="Users with access"
                            onPress={() => router.push("/settings/manage-users")}
                        />

                        <SettingLink
                            icon={<CircleIcon label="V" color="#f97316" />}
                            title="Camera Settings"
                            subtitle="Video quality & recording"
                            onPress={() => router.push("/settings/camera-settings")}
                        />

                        <SettingLink
                            icon={<CircleIcon label="W" color="#0ea5e9" />}
                            title="Device Configuration"
                            subtitle="Wi-Fi, Bluetooth, and firmware"
                            rightContent={
                                <Text style={[styles.badge, styles.badgeSolid]}>
                                    {isDeviceConnected ? "Online" : "Offline"}
                                </Text>
                            }
                            onPress={() => router.push("/settings/device-config")}
                        />

                        <SettingLink
                            icon={<CircleIcon label="+" color="#10B981" />}
                            title="Add a Device"
                            subtitle="Set up a new smart lock via Bluetooth"
                            onPress={() => router.push("/add-device")}
                        />
                    </View>
                </View>

                {/* System info */}
                {deviceId && (
                    <View style={[styles.card, styles.systemInfo]}>
                        <InfoRow label="Device ID" value={deviceId} />
                    </View>
                )}

                {deviceId && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: "#ef4444" }]}
                        onPress={handleForgetDevice}
                        activeOpacity={0.7}
                        disabled={forgetting}
                    >
                        {forgetting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Forget Device</Text>
                        )}
                    </TouchableOpacity>
                )}

                {user && (
                    <TouchableOpacity style={[styles.button, styles.buttonGhost]} onPress={signout} activeOpacity={0.7}>
                        <Text style={styles.buttonGhostText}>Sign Out</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

type SettingToggleProps = {
    icon: ReactNode;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    updating?: boolean;
    disabled?: boolean;
};

const SettingToggle = ({ icon, title, subtitle, value, onValueChange, updating, disabled }: SettingToggleProps) => {
    const { colors } = useTheme();
    return (
        <View style={[{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 12, gap: 12,
            borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
        }, disabled && { opacity: 0.5 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}>
                {icon}
                <View style={{ flexShrink: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{title}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{subtitle}</Text>
                </View>
            </View>
            {updating ? <ActivityIndicator size="small" color="#2563eb" /> : <Switch value={value} onValueChange={onValueChange} disabled={disabled} />}
        </View>
    );
};

type SettingLinkProps = {
    icon: ReactNode;
    title: string;
    subtitle: string;
    rightContent?: React.ReactNode;
    onPress?: () => void;
};

const SettingLink = ({ icon, title, subtitle, rightContent, onPress }: SettingLinkProps) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity activeOpacity={0.7} style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
        }} onPress={onPress}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {icon}
                <View>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{title}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{subtitle}</Text>
                </View>
            </View>
            {rightContent ? rightContent : <Text style={{ color: colors.textMuted, fontSize: 18, fontWeight: "900" }}>›</Text>}
        </TouchableOpacity>
    );
};

const CircleIcon = ({ label, color }: { label: string; color?: string }) => {
    const { colors } = useTheme();
    return (
        <View style={{
            width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
            backgroundColor: color ? `${color}1a` : colors.bgSubtle,
        }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: color ?? colors.text }}>{label}</Text>
        </View>
    );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => {
    const { colors } = useTheme();
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{label}</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{value}</Text>
        </View>
    );
};

function makeOfflineStyles(colors: any) {
    return {
        banner: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
            backgroundColor: colors.bgSubtle,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 8,
        },
        bannerText: {
            color: colors.textSecond,
            fontSize: 13,
            flexShrink: 1,
            marginRight: 12,
        },
        updateButton: {
            backgroundColor: "#2563eb",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            minWidth: 72,
            alignItems: "center" as const,
        },
        updateButtonText: {
            color: "#fff",
            fontWeight: "700" as const,
            fontSize: 13,
        },
    };
}
