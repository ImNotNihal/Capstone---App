import { View, StyleSheet } from "react-native";
import Events from "../pages/events/events";

export default function EventsScreen() {
    return (
        <View style={styles.screen}>
            <Events />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
