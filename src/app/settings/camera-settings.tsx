import { StyleSheet, View } from "react-native";
import CameraSettings from "@/src/pages/settings/camera-settings";

export default function CameraSettingsScreen() {
    return (
        <View style={styles.screen}>
            <CameraSettings />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
});
