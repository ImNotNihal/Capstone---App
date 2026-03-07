import { StyleSheet, View } from "react-native";
import Sensors from "../pages/sensors/sensors";

export default function SensorsScreen() {
    return (
        <View style={styles.screen}>
            <Sensors />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
