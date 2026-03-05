import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        justifyContent: "center",
        padding: 20,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 20,
        shadowColor: "#0f172a",
        shadowOpacity: 0.2,
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
        color: "#0f172a",
    },
    description: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: "#475569",
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
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
    },
    actionButtonPrimary: {
        borderColor: "#0ea5e9",
        backgroundColor: "#0ea5e9",
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
        color: "#0f172a",
    },
    actionTextOnPrimary: {
        color: "#ffffff",
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
        color: "#64748b",
        lineHeight: 20,
    },
});

export default styles;
