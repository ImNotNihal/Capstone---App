import { StyleSheet, View } from "react-native";
import ManageUsers from "@/src/pages/settings/manage-users";

export default function ManageUsersScreen() {
    return (
        <View style={styles.screen}>
            <ManageUsers />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
});
