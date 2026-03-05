import { StyleSheet, View } from "react-native";
import Settings from "../pages/settings/settings";
import Testing from "@/src/pages/testing/testing";

export default function TestingScreen() {
    return (
        <View style={styles.screen}>
            <Testing />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
