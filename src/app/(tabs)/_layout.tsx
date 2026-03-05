import {StyleSheet, Text, View} from "react-native";
import Navbar from "../../components/navbar/navbar";
import {SafeAreaView} from "react-native-safe-area-context";
export default function Index() {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Text>Smart Doorlock Mobile App</Text>
            </View>
            <Navbar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "space-between",
        backgroundColor: "#fff",
    },
    content: {
        padding: 16,
    },
});
