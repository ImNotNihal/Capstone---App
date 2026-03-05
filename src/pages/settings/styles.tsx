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
    card: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#fff",
        gap: 12,
    },
    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#2563eb",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },
    profileName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    profileEmail: {
        color: "#6b7280",
        fontSize: 14,
    },
    chevronText: {
        color: "#9ca3af",
        fontSize: 18,
        fontWeight: "900",
    },
    sectionTitle: {
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    rowCenter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flexShrink: 1,
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    rowSubtitle: {
        color: "#6b7280",
        fontSize: 13,
    },
    divide: {
        gap: 0,
        paddingHorizontal: 0,
    },
    linkRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#e5e7eb",
    },
    sectionSpacing: {
        paddingTop: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        fontSize: 12,
        overflow: "hidden",
        fontWeight: "700",
    },
    badgeOutline: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        color: "#111827",
        backgroundColor: "#fff",
    },
    badgeSolid: {
        backgroundColor: "#e0f2fe",
        color: "#075985",
    },
    progressTrack: {
        height: 8,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#2563eb",
    },
    button: {
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonPrimary: {
        backgroundColor: "#2563eb",
    },
    buttonPrimaryText: {
        color: "#fff",
        fontWeight: "700",
    },
    buttonOutline: {
        borderWidth: 1,
        borderColor: "#2563eb",
        marginTop: 8,
    },
    buttonOutlineText: {
        color: "#1d4ed8",
        fontWeight: "700",
    },
    buttonGhost: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#fff",
    },
    buttonGhostText: {
        color: "#b91c1c",
        fontWeight: "700",
    },
    buttonText: {
        fontSize: 15,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    infoLabel: {
        color: "#6b7280",
        fontSize: 13,
    },
    infoValue: {
        color: "#111827",
        fontWeight: "600",
    },
    systemInfo: {
        backgroundColor: "#f9fafb",
        gap: 8,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 15,
        color: "#111827",
    },
    settingToggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#e5e7eb",
        gap: 12,
    },
    circleIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f4f4f5",
        alignItems: "center",
        justifyContent: "center",
    },
    circleIconText: {
        fontSize: 15,
        fontWeight: "700",
    },
});

export default styles;
