import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Image, ImageSourcePropType, Pressable, Text, View } from "react-native";
import styles from "./styles";

type ToastVariant = "default" | "success" | "info" | "warning" | "danger";
type ToastPlacement = "top" | "bottom";

export type ToastProps = {
    visible: boolean;
    message: string;
    title?: string;
    variant?: ToastVariant;
    placement?: ToastPlacement;
    icon?: ImageSourcePropType;
    duration?: number | null;
    onDismiss?: () => void;
    offset?: number;
};

type VariantTheme = {
    accent: string;
    background: string;
    border: string;
    text: string;
    title: string;
};

const variantThemes: Record<ToastVariant, VariantTheme> = {
    default: {
        accent: "#111827",
        background: "#f5f5f5",
        border: "#e5e7eb",
        text: "#1f2937",
        title: "#111827",
    },
    success: {
        accent: "#16a34a",
        background: "#ecfdf3",
        border: "#bbf7d0",
        text: "#166534",
        title: "#0f5132",
    },
    info: {
        accent: "#2563eb",
        background: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
        title: "#1e3a8a",
    },
    warning: {
        accent: "#f59e0b",
        background: "#fffbeb",
        border: "#fde68a",
        text: "#92400e",
        title: "#78350f",
    },
    danger: {
        accent: "#ef4444",
        background: "#fef2f2",
        border: "#fecaca",
        text: "#b91c1c",
        title: "#991b1b",
    },
};

const defaultDuration = 2800;

const Toast = ({
    visible,
    message,
    title,
    variant = "default",
    placement = "bottom",
    icon,
    duration = defaultDuration,
    onDismiss,
    offset,
}: ToastProps) => {
    const theme = useMemo(() => variantThemes[variant], [variant]);
    const verticalOffset = offset ?? (placement === "top" ? 16 : 96);
    const hiddenOffset = placement === "top" ? -20 : 20;

    const translate = useRef(new Animated.Value(hiddenOffset)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) {
            translate.setValue(hiddenOffset);
        }
    }, [hiddenOffset, translate, visible]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translate, {
                    toValue: 0,
                    damping: 15,
                    stiffness: 160,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translate, {
                    toValue: hiddenOffset,
                    duration: 160,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 160,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [hiddenOffset, opacity, translate, visible]);

    useEffect(() => {
        if (!visible || duration === null || duration <= 0) return;

        const timeout = setTimeout(() => {
            onDismiss?.();
        }, duration);

        return () => clearTimeout(timeout);
    }, [duration, onDismiss, visible]);

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.overlay,
                placement === "top" ? { top: verticalOffset } : { bottom: verticalOffset },
                { opacity, transform: [{ translateY: translate }] },
            ]}
            accessibilityLiveRegion="polite"
        >
            <View
                style={[
                    styles.toast,
                    { backgroundColor: theme.background, borderColor: theme.border },
                ]}
            >
                <View style={[styles.accent, { backgroundColor: theme.accent }]} />

                <View style={styles.body}>
                    {icon ? (
                        <View style={[styles.iconBadge, { borderColor: theme.border }]}>
                            <Image source={icon} style={[styles.icon, { tintColor: theme.accent }]} />
                        </View>
                    ) : (
                        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                    )}

                    <View style={styles.textGroup}>
                        {title ? <Text style={[styles.title, { color: theme.title }]}>{title}</Text> : null}
                        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
                    </View>
                </View>

                {onDismiss ? (
                    <Pressable
                        hitSlop={10}
                        onPress={onDismiss}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss toast"
                        style={styles.closeButton}
                    >
                        <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
                    </Pressable>
                ) : null}
            </View>
        </Animated.View>
    );
};

export default Toast;
