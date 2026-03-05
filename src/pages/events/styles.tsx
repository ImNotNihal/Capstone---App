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
        gap: 16,
    },
    header: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
        paddingBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        marginTop: 4,
        color: "#6b7280",
        fontSize: 14,
    },
    filters: {
        flexDirection: "row",
        columnGap: 8,
    },
    filterPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
    },
    filterPillActive: {
        backgroundColor: "#e0e7ff",
        borderColor: "#4f46e5",
    },
    filterPillInactive: {
        backgroundColor: "#f4f4f5",
        borderColor: "#e5e7eb",
    },
    filterText: {
        fontSize: 13,
        fontWeight: "600",
    },
    filterTextActive: {
        color: "#312e81",
    },
    filterTextInactive: {
        color: "#4b5563",
    },
    list: {
        rowGap: 12,
    },
    card: {
        flexDirection: "row",
        gap: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#fff",
    },
    cardIconWrapper: {
        justifyContent: "flex-start",
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    cardIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    cardContent: {
        flex: 1,
        rowGap: 6,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    cardDescription: {
        color: "#4b5563",
        fontSize: 14,
    },
    cardTimestamp: {
        color: "#6b7280",
        fontSize: 12,
    },
    alertBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#fee2e2",
    },
    alertText: {
        color: "#b91c1c",
        fontWeight: "700",
        fontSize: 11,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 32,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        backgroundColor: "#f9fafb",
        gap: 4,
    },
    emptyTitle: {
        fontWeight: "700",
        color: "#111827",
    },
    emptySubtitle: {
        color: "#6b7280",
    },
});

export default styles;
