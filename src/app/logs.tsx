import { View, StyleSheet } from "react-native";
import Logs from "../pages/logs/logs";

export default function LogsScreen() {
    return (
        <View style={styles.screen}>
            <Logs />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
