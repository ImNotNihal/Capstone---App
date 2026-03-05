import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        zIndex: 50,
    },
    toast: {
        flexDirection: "row",
        alignItems: "stretch",
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        backgroundColor: "#fff",
    },
    accent: {
        width: 4,
        borderRadius: 999,
        marginRight: 12,
    },
    body: {
        flex: 1,
        flexDirection: "row",
        columnGap: 10,
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        backgroundColor: "#fff",
    },
    icon: {
        width: 18,
        height: 18,
        resizeMode: "contain",
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginTop: 4,
    },
    textGroup: {
        flex: 1,
        rowGap: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    message: {
        fontSize: 13,
        lineHeight: 18,
        color: "#374151",
    },
    closeButton: {
        marginLeft: 12,
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignSelf: "center",
    },
    closeText: {
        fontSize: 16,
        color: "#6b7280",
        fontWeight: "600",
        lineHeight: 18,
    },
});

export default styles;
