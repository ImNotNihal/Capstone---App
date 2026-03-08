import { StyleSheet } from "react-native";
import { darkColors } from "@/src/context/theme-context";

type Colors = typeof darkColors;

export function createStyles(colors: Colors) {
    return StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: colors.bg,
        },
        container: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 96,
            gap: 16,
        },
        header: {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            paddingBottom: 12,
        },
        title: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            marginTop: 4,
            color: colors.textTertiary,
            fontSize: 14,
        },
        card: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            backgroundColor: colors.bgCard,
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
            color: colors.text,
        },
        profileEmail: {
            color: colors.textTertiary,
            fontSize: 14,
        },
        chevronText: {
            color: colors.textMuted,
            fontSize: 18,
            fontWeight: "900",
        },
        sectionTitle: {
            marginBottom: 8,
            marginLeft: 4,
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
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
            color: colors.text,
        },
        rowSubtitle: {
            color: colors.textTertiary,
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
            borderBottomColor: colors.border,
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
            borderColor: colors.borderLight,
            color: colors.text,
            backgroundColor: colors.bgCard,
        },
        badgeSolid: {
            backgroundColor: "#172554",
            color: "#93c5fd",
        },
        progressTrack: {
            height: 8,
            borderRadius: 8,
            backgroundColor: colors.border,
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
            borderColor: colors.borderLight,
            marginTop: 8,
        },
        buttonOutlineText: {
            color: colors.text,
            fontWeight: "700",
        },
        buttonGhost: {
            borderWidth: 1,
            borderColor: colors.borderLight,
            backgroundColor: colors.bgCard,
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
            color: colors.textTertiary,
            fontSize: 13,
        },
        infoValue: {
            color: colors.text,
            fontWeight: "600",
        },
        systemInfo: {
            backgroundColor: colors.bgSubtle,
            gap: 8,
        },
        inputGroup: {
            gap: 6,
        },
        inputLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecond,
        },
        input: {
            borderWidth: 1,
            borderColor: colors.borderLight,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            fontSize: 15,
            color: colors.text,
            backgroundColor: colors.bgCard,
        },
        settingToggleRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
            gap: 12,
        },
        circleIcon: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.bgSubtle,
            alignItems: "center",
            justifyContent: "center",
        },
        circleIconText: {
            fontSize: 15,
            fontWeight: "700",
        },

        /* --- WIZARD STYLES FOR ADD-DEVICE --- */
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
            color: colors.text,
            textAlign: "center",
        },
        stepDescription: {
            fontSize: 15,
            color: colors.textSecond,
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
}

// Default export: dark theme styles (for any file that imports without theme)
export default createStyles({
    bg: "#050505",
    bgCard: "#09090B",
    bgSubtle: "#0A0A0A",
    border: "#18181B",
    borderLight: "#27272A",
    text: "#FAFAFA",
    textSecond: "#A1A1AA",
    textTertiary: "#71717A",
    textMuted: "#52525B",
    accent: "#2563eb",
    navBg: "#09090B",
    navBorder: "#18181B",
    navActive: "#FAFAFA",
    navInactive: "#52525B",
    navIcon: "#3F3F46",
    navIconActive: "#2563eb",
    shellBg: "#050505",
});
