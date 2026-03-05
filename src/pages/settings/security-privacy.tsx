import React, { useContext, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import styles from "./styles";
import { AppContext } from "@/src/context/app-context";

export default function SecurityPrivacy() {
    const { deviceId } = useContext(AppContext);
    const [autoLock, setAutoLock] = useState(true);
    const [failedAttemptLock, setFailedAttemptLock] = useState(true);

    // For now hardcoded — will come from accessControl collection later
    const userRole = "owner";

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Security</Text>
                <Text style={styles.subtitle}>Configure lock security behavior</Text>
            </View>

            {/* Security Settings */}
            <View>
                <Text style={styles.sectionTitle}>Security</Text>
                <View style={[styles.card, styles.divide]}>
                    <ToggleRow
                        icon="A" color="#ef4444"
                        title="Auto-Lock"
                        subtitle="Automatically lock after 30 seconds"
                        value={autoLock}
                        onValueChange={setAutoLock}
                    />
                    <ToggleRow
                        icon="L" color="#8b5cf6"
                        title="Failed Attempt Lockout"
                        subtitle="Lock after 5 failed access attempts"
                        value={failedAttemptLock}
                        onValueChange={setFailedAttemptLock}
                    />
                </View>
            </View>

            {/* Device info */}
            <View style={[styles.card, styles.systemInfo]}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Device ID</Text>
                    <Text style={styles.infoValue}>{deviceId || "—"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Access Control</Text>
                    <Text style={styles.infoValue}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const ToggleRow = ({ icon, color, title, subtitle, value, onValueChange }: {
    icon: string; color: string; title: string; subtitle: string; value: boolean; onValueChange: (v: boolean) => void;
}) => (
    <View style={styles.settingToggleRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}>
            <View style={[styles.circleIcon, { backgroundColor: `${color}1a` }]}>
                <Text style={[styles.circleIconText, { color }]}>{icon}</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSubtitle}>{subtitle}</Text>
            </View>
        </View>
        <Switch value={value} onValueChange={onValueChange} />
    </View>
);
