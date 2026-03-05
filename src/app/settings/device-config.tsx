import { StyleSheet, View } from "react-native";
import DeviceConfig from "@/src/pages/settings/device-config";

export default function DeviceConfigScreen() {
    return (
        <View style={styles.screen}>
            <DeviceConfig />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
