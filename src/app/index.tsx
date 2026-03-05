import { View, StyleSheet } from "react-native";
import Home from "../pages/home/home";

export default function Index() {
    
    return (
        <View style={styles.screen}>
            <Home />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
