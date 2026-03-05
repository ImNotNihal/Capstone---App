import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import Navbar from "../components/navbar/navbar";
import {BleProvider} from "@/src/context/ble-context";
import {AppProvider} from "@/src/context/app-context";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AppProvider>
                <BleProvider>
                    <SafeAreaView style={styles.shell}>
                        <View style={styles.body}>
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    animation: "fade",
                                    animationDuration: 120,
                                    contentStyle: styles.content,
                                }}
                            >
                                <Stack.Screen name="index" />
                                <Stack.Screen name="events" />
                                <Stack.Screen name="sensors" />
                                <Stack.Screen name="settings" />
                                <Stack.Screen name="(tabs)" />
                            </Stack>
                        </View>
                        <Navbar />
                    </SafeAreaView>
                </BleProvider>
            </AppProvider>
        </SafeAreaProvider>
        
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
        backgroundColor: "#fff",
    },
    body: {
        flex: 1,
        width: "100%",
        maxWidth: 700,
        marginHorizontal: "auto",
    },
    content: {
        backgroundColor: "rgba(255,255,255,0.92)",
    },
});
