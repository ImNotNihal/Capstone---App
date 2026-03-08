import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

function BackButton() {
    const router = useRouter();
    return (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <Text style={styles.backText}>‹ Sensors</Text>
        </TouchableOpacity>
    );
}

export default function SensorsLayout() {
    return (
        <Stack>
            {/* Index screen — sensors main page, no header */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
            {/* These pages have their own custom dark headers */}
            <Stack.Screen name="motion-settings" options={{ headerShown: false }} />
            <Stack.Screen name="pin-settings" options={{ headerShown: false }} />
            {/* These pages rely on the Stack header for back navigation */}
            <Stack.Screen
                name="facial-settings"
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: "#fff" },
                    headerShadowVisible: false,
                    headerTitleAlign: "center",
                    title: "",
                    headerLeft: () => <BackButton />,
                }}
            />
            <Stack.Screen
                name="biometric-settings"
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: "#fff" },
                    headerShadowVisible: false,
                    headerTitleAlign: "center",
                    title: "",
                    headerLeft: () => <BackButton />,
                }}
            />
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
