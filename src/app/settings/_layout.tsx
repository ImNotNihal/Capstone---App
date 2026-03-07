import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

function BackButton() {
    const router = useRouter();
    return (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <Text style={styles.backText}>‹ Settings</Text>
        </TouchableOpacity>
    );
}

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: "#fff" },
                headerShadowVisible: false,
                headerTitleAlign: "center",
                title: "",
                headerLeft: () => <BackButton />,
            }}
        >
            {/* Main settings page — no header (it has its own) */}
            <Stack.Screen name="index" options={{ headerShown: false }} />

            {/* Sub-pages — show back button header */}
            <Stack.Screen name="manage-users" />
            <Stack.Screen name="security-privacy" />
            <Stack.Screen name="device-config" />
            <Stack.Screen name="camera-settings" />
        </Stack>
    );
}

const styles = StyleSheet.create({
    backBtn: {
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    backText: {
        fontSize: 16,
        color: "#2563eb",
        fontWeight: "600",
    },
});
