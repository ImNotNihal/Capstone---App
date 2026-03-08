import { Stack } from "expo-router";

export default function SensorsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="motion-settings" />
            <Stack.Screen name="pin-settings" />
            <Stack.Screen name="facial-settings" />
            <Stack.Screen name="biometric-settings" />
        </Stack>
    );
}