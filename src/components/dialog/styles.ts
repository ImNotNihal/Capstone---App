import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        justifyContent: "center",
        padding: 20,
    },
    card: {
        backgroundColor: "#09090B",
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: "#18181B",
        shadowColor: "#000",
        shadowOpacity: 0.6,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FAFAFA",
    },
    description: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: "#71717A",
    },
    body: {
        marginTop: 4,
    },
    actions: {
        marginTop: 18,
        flexDirection: "row",
        justifyContent: "flex-end",
        columnGap: 10,
    },
    actionButton: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#27272A",
        backgroundColor: "#18181B",
    },
    actionButtonPrimary: {
        borderColor: "#FAFAFA",
        backgroundColor: "#FAFAFA",
    },
    actionButtonDanger: {
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FAFAFA",
    },
    actionTextOnPrimary: {
        color: "#050505",
    },
    closeButton: {
        position: "absolute",
        right: 8,
        top: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    closeText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#71717A",
        lineHeight: 20,
    },
});

export default styles;
