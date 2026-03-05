import { StyleSheet, View } from "react-native";
import Settings from "@/src/pages/settings/settings";

export default function SettingsScreen() {
    return (
        <View style={styles.screen}>
            <Settings />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
