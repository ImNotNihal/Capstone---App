"use client";

import { AppContext, AppProvider } from "@/src/context/app-context";
import { BleProvider } from "@/src/context/ble-context";
import { ThemeProvider, useTheme } from "@/src/context/theme-context";
import { Stack, usePathname, useRootNavigationState, useRouter, useSegments } from "expo-router";
import React, { useContext, useEffect } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../components/navbar/navbar";

/**
 * Prevents "Attempted to navigate before mounting" error.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useContext(AppContext);
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();

    useEffect(() => {
        // 1. Wait until Expo Router is actually mounted
        if (!navigationState?.key) return;

        // 2. Wait until AppContext has finished reading local storage
        if (loading) return;

        const onSignin = segments[0] === "signin";

        if (!user && !onSignin) {
            router.replace("/signin");
        } else if (user && onSignin) {
            router.replace("/");
        }
    }, [user, loading, segments, navigationState?.key]);

    // Show a blank splash or spinner until ready to prevent crashing the Root Layout
    if (loading || !navigationState?.key) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return <>{children}</>;
}

function ThemedShell() {
    const { colors } = useTheme();
    const pathname = usePathname();
    const isSignin = pathname === "/signin";

    return (
        <SafeAreaView style={[styles.shell, { backgroundColor: colors.shellBg }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.shellBg} />
            <View style={styles.body}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: "fade",
                        animationDuration: 120,
                        contentStyle: { backgroundColor: colors.bg },
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="events" />
                    <Stack.Screen name="sensors" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="testing" />
                    <Stack.Screen name="logs" />
                    <Stack.Screen name="add-device" />
                    <Stack.Screen name="signin" options={{ animation: "none" }} />
                </Stack>
            </View>
            {!isSignin && <Navbar />}
        </SafeAreaView>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AppProvider>
                    <BleProvider>
                        <AuthGuard>
                            <ThemedShell />
                        </AuthGuard>
                    </BleProvider>
                </AppProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    shell: { flex: 1 },
    body: {
        flex: 1,
        width: "100%",
        maxWidth: 700,
        marginHorizontal: "auto",
    },
});