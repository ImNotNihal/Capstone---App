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

const sharedScreenOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: "#050505" },
    headerShadowVisible: false,
    title: "",
    headerLeft: () => <BackButton />,
};

export default function SettingsLayout() {
    return (
        <Stack>
            {/* Main settings page — no header (it has its own) */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
            
            {/* Sub-pages — show back button header */}
            <Stack.Screen name="manage-users" options={sharedScreenOptions} />
            <Stack.Screen name="security-privacy" options={sharedScreenOptions} />
            <Stack.Screen name="device-config" options={sharedScreenOptions} />
            <Stack.Screen name="camera-settings" options={sharedScreenOptions} />
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
        color: "#FAFAFA", // Removed the duplicate blue color
        fontWeight: "600",
    },
});