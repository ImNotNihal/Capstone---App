import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";
import { AppContext } from "@/src/context/app-context";
import { useSettings } from "@/src/hooks/useSettings";
import { useFocusEffect } from "@react-navigation/native";

export default function SecurityPrivacy() {
    const { deviceId } = useContext(AppContext);
    const { settings, loading, error, updatingKeys, updateSetting, refetch } = useSettings();
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const handleToggle = async (key: "autoLock" | "failedAttemptLimit", value: boolean) => {
        setSettingsError(null);
        try {
            if (key === "failedAttemptLimit") {
                await updateSetting("failedAttemptLimit", value ? 5 : 0);
            } else {
                await updateSetting(key, value);
            }
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
    const failedAttemptEnabled = settings.failedAttemptLimit > 0;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Security</Text>
                <Text style={styles.subtitle}>Configure lock security behavior</Text>
            </View>

            <View>
                <Text style={styles.sectionTitle}>Security</Text>

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
                                    style={offlineStyles.retryButton}
                                    disabled={retrying}
                                >
                                    {retrying ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={offlineStyles.retryButtonText}>Retry</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.card, styles.divide]}>
                            <ToggleRow
                                icon="A"
                                color="#ef4444"
                                title="Auto-Lock"
                                subtitle={`Automatically lock after ${settings.autoLockTimeout}s`}
                                value={settings.autoLock}
                                onValueChange={(v) => handleToggle("autoLock", v)}
                                updating={updatingKeys.has("autoLock")}
                                disabled={isOffline}
                            />
                            <ToggleRow
                                icon="L"
                                color="#8b5cf6"
                                title="Failed Attempt Lockout"
                                subtitle={`Lock after ${settings.failedAttemptLimit || 5} failed attempts`}
                                value={failedAttemptEnabled}
                                onValueChange={(v) => handleToggle("failedAttemptLimit", v)}
                                updating={updatingKeys.has("failedAttemptLimit")}
                                disabled={isOffline}
                            />
                        </View>
                    </>
                )}

                {settingsError && (
                    <Text style={{ color: "#b91c1c", fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                        {settingsError}
                    </Text>
                )}
            </View>

            <View style={[styles.card, styles.systemInfo]}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Device ID</Text>
                    <Text style={styles.infoValue}>{deviceId || "—"}</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const ToggleRow = ({
    icon,
    color,
    title,
    subtitle,
    value,
    onValueChange,
    updating,
    disabled,
}: {
    icon: string;
    color: string;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    updating?: boolean;
    disabled?: boolean;
}) => (
    <View style={[styles.settingToggleRow, disabled && { opacity: 0.5 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}>
            <View style={[styles.circleIcon, { backgroundColor: `${color}1a` }]}>
                <Text style={[styles.circleIconText, { color }]}>{icon}</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
        </View>
        {updating ? (
            <ActivityIndicator size="small" color="#2563eb" />
        ) : (
            <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
        )}
    </View>
);

const offlineStyles = {
    banner: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        backgroundColor: "#18181B",
        borderWidth: 1,
        borderColor: "#27272A",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
    },
    bannerText: {
        color: "#A1A1AA",
        fontSize: 13,
        flexShrink: 1,
        marginRight: 12,
    },
    retryButton: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 72,
        alignItems: "center" as const,
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "700" as const,
        fontSize: 13,
    },
};
