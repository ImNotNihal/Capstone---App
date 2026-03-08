import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";
import { AppContext } from "@/src/context/app-context";
import { API_BASE_URL } from "@/src/config";

const VALID_METHODS = ["face", "fingerprint", "keypad", "bluetooth"] as const;
type AuthMethod = (typeof VALID_METHODS)[number];

const METHOD_LABELS: Record<AuthMethod, { label: string; icon: string; color: string; description: string }> = {
    face: { label: "Face Recognition", icon: "F", color: "#f97316", description: "Unlock with enrolled face" },
    fingerprint: { label: "Fingerprint", icon: "P", color: "#8b5cf6", description: "Biometric fingerprint scan" },
    keypad: { label: "Keypad", icon: "K", color: "#ec4899", description: "4-6 digit PIN code" },
    bluetooth: { label: "Bluetooth", icon: "B", color: "#2563eb", description: "Proximity auto-unlock" },
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
    owner: ["Lock", "Unlock", "Settings", "Manage Users"],
    guest: ["Lock", "Unlock"],
};

const FETCH_TIMEOUT = 8000;

type CredentialState = Record<AuthMethod, boolean>;

export default function ManageUsers() {
    const { user, authToken, deviceId } = useContext(AppContext);

    const [credentials, setCredentials] = useState<CredentialState>({
        face: false,
        fingerprint: false,
        keypad: false,
        bluetooth: false,
    });
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loadingCreds, setLoadingCreds] = useState(true);
    const [loadingRole, setLoadingRole] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [togglingMethod, setTogglingMethod] = useState<AuthMethod | null>(null);

    const headers = useCallback(() => {
        const h: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) h["Authorization"] = `Bearer ${authToken}`;
        return h;
    }, [authToken]);

    // Fetch user role from device info
    const fetchRole = useCallback(async () => {
        if (!authToken || !deviceId) {
            setLoadingRole(false);
            return;
        }
        setLoadingRole(true);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/info`, {
                headers: headers(),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error("Failed to load role");
            const data = await res.json();
            setUserRole(data.role ?? "guest");
        } catch {
            setUserRole("guest");
        } finally {
            setLoadingRole(false);
        }
    }, [authToken, deviceId, headers]);

    // Fetch current credentials
    const fetchCredentials = useCallback(async () => {
        if (!authToken) {
            setLoadingCreds(false);
            return;
        }
        setLoadingCreds(true);
        setError(null);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const res = await fetch(`${API_BASE_URL}credentials/me`, {
                headers: headers(),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error("Failed to load credentials");
            const data = await res.json();
            const methods = data.authMethods || {};
            setCredentials({
                face: methods.face?.isActive ?? false,
                fingerprint: methods.fingerprint?.isActive ?? false,
                keypad: methods.keypad?.isActive ?? false,
                bluetooth: methods.bluetooth?.isActive ?? false,
            });
        } catch (e: any) {
            setError(e.name === "AbortError" ? "Server unreachable" : (e.message || "Failed to load"));
        } finally {
            setLoadingCreds(false);
        }
    }, [authToken, headers]);

    useEffect(() => {
        fetchRole();
        fetchCredentials();
    }, [fetchRole, fetchCredentials]);

    const toggleMethod = async (method: AuthMethod, enable: boolean) => {
        const prev = credentials[method];
        setCredentials((c) => ({ ...c, [method]: enable }));
        setTogglingMethod(method);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const endpoint = enable ? "enroll" : "revoke";
            const res = await fetch(`${API_BASE_URL}credentials/me/${endpoint}`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ method }),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.detail || "Failed to update");
            }
        } catch (e: any) {
            setCredentials((c) => ({ ...c, [method]: prev }));
            setError(e.message || "Failed to update credential");
        } finally {
            setTogglingMethod(null);
        }
    };

    const role = userRole ?? "guest";
    const permissions = ROLE_PERMISSIONS[role] ?? [];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Users</Text>
                <Text style={styles.subtitle}>Control who can access your lock</Text>
            </View>

            {/* Current user card */}
            <View style={styles.card}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={localStyles.userAvatar}>
                        <Text style={localStyles.userAvatarText}>
                            {user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "?"}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={styles.profileName}>
                                {user ? `${user.firstName} ${user.lastName}` : "Current User"}
                            </Text>
                            {loadingRole ? (
                                <ActivityIndicator size="small" color="#2563eb" />
                            ) : (
                                <Text style={localStyles.ownerBadge}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.profileEmail}>{user?.email || ""}</Text>
                    </View>
                </View>
            </View>

            {/* Role permissions */}
            <View>
                <Text style={styles.sectionTitle}>Permissions</Text>
                {loadingRole ? (
                    <View style={[styles.card, { alignItems: "center", paddingVertical: 16 }]}>
                        <ActivityIndicator size="small" color="#2563eb" />
                    </View>
                ) : (
                    <View style={styles.card}>
                        {permissions.length === 0 ? (
                            <Text style={{ color: "#6b7280", fontSize: 13 }}>No permissions</Text>
                        ) : (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                {permissions.map((perm) => (
                                    <Text key={perm} style={localStyles.permBadge}>
                                        {perm}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Access Methods */}
            <View>
                <Text style={styles.sectionTitle}>Access Methods</Text>
                {loadingCreds ? (
                    <View style={[styles.card, { alignItems: "center", paddingVertical: 24 }]}>
                        <ActivityIndicator size="small" color="#2563eb" />
                        <Text style={[styles.rowSubtitle, { marginTop: 8 }]}>Loading credentials...</Text>
                    </View>
                ) : (
                    <>
                        {error && (
                            <View style={localStyles.errorBanner}>
                                <Text style={localStyles.errorText}>{error}</Text>
                                <TouchableOpacity onPress={fetchCredentials}>
                                    <Text style={{ color: "#2563eb", fontWeight: "600", fontSize: 13 }}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={[styles.card, styles.divide]}>
                            {VALID_METHODS.map((method) => {
                                const info = METHOD_LABELS[method];
                                const isToggling = togglingMethod === method;
                                return (
                                    <View key={method} style={styles.settingToggleRow}>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 12,
                                                flexShrink: 1,
                                            }}
                                        >
                                            <View
                                                style={[
                                                    styles.circleIcon,
                                                    { backgroundColor: `${info.color}1a` },
                                                ]}
                                            >
                                                <Text
                                                    style={[styles.circleIconText, { color: info.color }]}
                                                >
                                                    {info.icon}
                                                </Text>
                                            </View>
                                            <View style={{ flexShrink: 1 }}>
                                                <Text style={styles.rowTitle}>{info.label}</Text>
                                                <Text style={styles.rowSubtitle}>{info.description}</Text>
                                            </View>
                                        </View>
                                        {isToggling ? (
                                            <ActivityIndicator size="small" color="#2563eb" />
                                        ) : (
                                            <Switch
                                                value={credentials[method]}
                                                onValueChange={(v) => toggleMethod(method, v)}
                                            />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
            </View>

            {/* Device info */}
            <View style={[styles.card, styles.systemInfo]}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Device ID</Text>
                    <Text style={styles.infoValue}>{deviceId || "—"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role</Text>
                    <Text style={styles.infoValue}>
                        {loadingRole ? "..." : role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const localStyles = {
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#2563eb",
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    userAvatarText: {
        color: "#fff",
        fontWeight: "700" as const,
        fontSize: 16,
    },
    ownerBadge: {
        fontSize: 11,
        fontWeight: "700" as const,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: "hidden" as const,
        backgroundColor: "#172554",
        color: "#93c5fd",
    },
    permBadge: {
        fontSize: 13,
        fontWeight: "600" as const,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#18181B",
        color: "#A1A1AA",
        overflow: "hidden" as const,
    },
    errorBanner: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        backgroundColor: "#18181B",
        borderWidth: 1,
        borderColor: "#27272A",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    errorText: {
        color: "#A1A1AA",
        fontSize: 13,
        flexShrink: 1,
        marginRight: 12,
    },
};
