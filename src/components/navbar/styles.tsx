import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: 64,
        width: "100%",
        backgroundColor: "#09090B",
        borderTopWidth: 1,
        borderTopColor: "#18181B",
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
        tintColor: "#3F3F46",
    },
    label: {
        textAlign: "center",
        fontSize: 11,
    },
    labelActive: {
        color: "#FAFAFA",
        fontWeight: "700",
    },
    labelInactive: {
        color: "#52525B",
        fontWeight: "500",
    },
})

export default styles;
