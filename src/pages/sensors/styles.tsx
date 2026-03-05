import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
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
    list: {
        rowGap: 12,
    },
    card: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#fff",
        gap: 10,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    iconTitle: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    iconBadgeActive: {
        backgroundColor: "rgba(37, 99, 235, 0.12)",
    },
    iconBadgeInactive: {
        backgroundColor: "#f4f4f5",
    },
    icon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    cardLocation: {
        color: "#6b7280",
        fontSize: 13,
    },
    metaGroup: {
        gap: 6,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metaSpacing: {
        paddingTop: 2,
    },
    metaLabel: {
        color: "#6b7280",
        fontSize: 13,
    },
    metaValue: {
        color: "#111827",
        fontSize: 13,
        fontWeight: "600",
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        fontSize: 12,
        overflow: "hidden",
    },
    badgeActive: {
        backgroundColor: "#e0f2fe",
        color: "#075985",
        fontWeight: "700",
    },
    badgeMuted: {
        backgroundColor: "#f4f4f5",
        color: "#4b5563",
        fontWeight: "700",
    },
    badgeOutline: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        color: "#111827",
        backgroundColor: "#fff",
        fontWeight: "700",
    },
    progressTrack: {
        height: 6,
        borderRadius: 6,
        backgroundColor: "#f4f4f5",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#22c55e",
        borderRadius: 6,
    },
    progressLow: {
        backgroundColor: "#ef4444",
    },
    destructiveText: {
        color: "#b91c1c",
    },
    summary: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
    },
    summaryCard: {
        flex: 1,
        paddingVertical: 14,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: "#e5e7eb",
    },
    summaryNumber: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    summaryLabel: {
        color: "#6b7280",
        fontSize: 12,
        marginTop: 2,
    },
});

export default styles;