import { Stack, usePathname, useRootNavigationState, useRouter, useSegments } from "expo-router";
import React, { useContext, useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, StyleSheet, View } from "react-native";
import Navbar from "../components/navbar/navbar";
import { BleProvider } from "@/src/context/ble-context";
import { AppProvider, AppContext } from "@/src/context/app-context";
import { ThemeProvider, useTheme } from "@/src/context/theme-context";

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user }   = useContext(AppContext);
    const segments   = useSegments();
    const router     = useRouter();
    const navState   = useRootNavigationState();

    useEffect(() => {
        // Wait until the navigator is mounted before redirecting
        if (!navState?.key) return;

        const onSignin = segments[0] === "signin";
        if (!user && !onSignin) {
            router.replace("/signin");
        } else if (user && onSignin) {
            router.replace("/");
        }
    }, [user, segments, router, navState?.key]);

    return <>{children}</>;
}

function ThemedShell() {
    const { colors } = useTheme();
    const pathname   = usePathname();
    const isSignin   = pathname === "/signin";

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
    shell: {
        flex: 1,
    },
    body: {
        flex: 1,
        width: "100%",
        maxWidth: 700,
        marginHorizontal: "auto",
    },
});
