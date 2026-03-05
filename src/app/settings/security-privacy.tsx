import { StyleSheet, View } from "react-native";
import SecurityPrivacy from "@/src/pages/settings/security-privacy";

export default function SecurityPrivacyScreen() {
    return (
        <View style={styles.screen}>
            <SecurityPrivacy />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
});
