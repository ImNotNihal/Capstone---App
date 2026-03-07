import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#fff",
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 96,
        gap: 12,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
        paddingBottom: 12,
    },
    titleGroup: {
        gap: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    devBadge: {
        alignSelf: "flex-start",
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#f59e0b",
    },
    devBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#b45309",
        letterSpacing: 0.5,
    },
    clearButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    clearButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
    },
    card: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#fff",
        gap: 8,
    },
    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    methodBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        minWidth: 48,
        alignItems: "center",
    },
    methodText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    path: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        minWidth: 48,
        alignItems: "center",
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    metaRow: {
        flexDirection: "row",
        gap: 12,
    },
    metaText: {
        fontSize: 12,
        color: "#6b7280",
    },
    responseBox: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        padding: 10,
    },
    responseText: {
        fontSize: 11,
        color: "#374151",
        fontFamily: "monospace",
    },
    errorText: {
        fontSize: 12,
        color: "#b91c1c",
        fontWeight: "500",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        backgroundColor: "#f9fafb",
        gap: 4,
    },
    emptyTitle: {
        fontWeight: "700",
        color: "#111827",
        fontSize: 16,
    },
    emptySubtitle: {
        color: "#6b7280",
        fontSize: 14,
    },
});

export default styles;
