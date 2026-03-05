import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: 64,
        width: "100%",
    },
    navbarItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
        marginBottom: 4,
    },
    iconActive: {
        tintColor: "#2563eb",
    },
    iconInactive: {
        tintColor: "#4b5563",
    },
    label: {
        textAlign: "center",
    },
    labelActive: {
        color: "#111827",
        fontWeight: "700",
    },
    labelInactive: {
        color: "#4b5563",
        fontWeight: "500",
    },
})

export default styles;
