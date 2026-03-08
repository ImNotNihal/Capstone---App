import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#050505",
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 96,
        gap: 16,
    },
    header: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: "#18181B",
        paddingBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FAFAFA",
    },
    subtitle: {
        marginTop: 4,
        color: "#71717A",
        fontSize: 14,
    },
    card: {
        borderWidth: 1,
        borderColor: "#18181B",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#09090B",
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
        color: "#FAFAFA",
    },
    profileEmail: {
        color: "#71717A",
        fontSize: 14,
    },
    chevronText: {
        color: "#3F3F46",
        fontSize: 18,
        fontWeight: "900",
    },
    sectionTitle: {
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 16,
        fontWeight: "700",
        color: "#FAFAFA",
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
        color: "#FAFAFA",
    },
    rowSubtitle: {
        color: "#71717A",
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
        borderBottomColor: "#18181B",
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
        borderColor: "#27272A",
        color: "#FAFAFA",
        backgroundColor: "#09090B",
    },
    badgeSolid: {
        backgroundColor: "#172554",
        color: "#93c5fd",
    },
    progressTrack: {
        height: 8,
        borderRadius: 8,
        backgroundColor: "#18181B",
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
        borderColor: "#27272A",
        marginTop: 8,
    },
    buttonOutlineText: {
        color: "#FAFAFA",
        fontWeight: "700",
    },
    buttonGhost: {
        borderWidth: 1,
        borderColor: "#27272A",
        backgroundColor: "#09090B",
    },
    buttonGhostText: {
        color: "#EF4444",
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
        color: "#71717A",
        fontSize: 13,
    },
    infoValue: {
        color: "#FAFAFA",
        fontWeight: "600",
    },
    systemInfo: {
        backgroundColor: "#0A0A0A",
        gap: 8,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#A1A1AA",
    },
    input: {
        borderWidth: 1,
        borderColor: "#27272A",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 15,
        color: "#FAFAFA",
        backgroundColor: "#09090B",
    },
    settingToggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#18181B",
        gap: 12,
    },
    circleIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#18181B",
        alignItems: "center",
        justifyContent: "center",
    },
    circleIconText: {
        fontSize: 15,
        fontWeight: "700",
    },

    /* --- ADDED WIZARD STYLES FOR ADD-DEVICE --- */
    flex1: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
        justifyContent: "center",
        paddingVertical: 40,
        gap: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FAFAFA",
        textAlign: "center",
    },
    stepDescription: {
        fontSize: 15,
        color: "#A1A1AA",
        textAlign: "center",
        lineHeight: 22,
    },
    successContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    successIcon: {
        fontSize: 64,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: "#10B981",
    },
    footer: {
        flexDirection: "row",
        gap: 12,
        paddingTop: 16,
        marginTop: "auto",
    },
    buttonSuccess: {
        backgroundColor: "#10B981",
    },
});

export default styles;