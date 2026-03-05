import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Modal,
    Pressable,
    Text,
    View,
} from "react-native";
import styles from "./styles";

type ActionVariant = "primary" | "secondary" | "danger";

type DialogAction = {
    label: string;
    onPress: () => void;
    variant?: ActionVariant;
    disabled?: boolean;
};

export type DialogProps = {
    visible: boolean;
    title?: string;
    description?: string;
    children?: React.ReactNode;
    primaryAction?: DialogAction;
    secondaryAction?: DialogAction;
    onDismiss?: () => void;
    dismissOnBackdropPress?: boolean;
    showCloseButton?: boolean;
};

const Dialog = ({
    visible,
    title,
    description,
    children,
    primaryAction,
    secondaryAction,
    onDismiss,
    dismissOnBackdropPress = true,
    showCloseButton = false,
}: DialogProps) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (!visible) return;

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                damping: 16,
                stiffness: 160,
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacity, scale, visible]);

    useEffect(() => {
        if (!visible) {
            opacity.setValue(0);
            scale.setValue(0.95);
        }
    }, [opacity, scale, visible]);

    const actions = useMemo(() => {
        const ordered: DialogAction[] = [];
        if (secondaryAction) ordered.push(secondaryAction);
        if (primaryAction) ordered.push(primaryAction);
        return ordered;
    }, [primaryAction, secondaryAction]);

    const renderAction = (action: DialogAction) => {
        const variant = action.variant ?? "secondary";
        return (
            <Pressable
                key={action.label}
                onPress={action.onPress}
                disabled={action.disabled}
                style={({ pressed }) => [
                    styles.actionButton,
                    variant === "primary" ? styles.actionButtonPrimary : null,
                    variant === "danger" ? styles.actionButtonDanger : null,
                    action.disabled ? styles.actionButtonDisabled : null,
                    pressed && !action.disabled ? { opacity: 0.85 } : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
            >
                <Text
                    style={[
                        styles.actionText,
                        variant === "primary" || variant === "danger"
                            ? styles.actionTextOnPrimary
                            : null,
                    ]}
                >
                    {action.label}
                </Text>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <Pressable
                style={styles.backdrop}
                onPress={dismissOnBackdropPress ? onDismiss : undefined}
                accessibilityRole="button"
                accessibilityLabel="Dismiss dialog"
                accessibilityViewIsModal
            >
                <Animated.View
                    style={{ opacity, transform: [{ scale }] }}
                >
                    <Pressable
                        onPress={() => null}
                        style={styles.card}
                        accessibilityRole="summary"
                    >
                        {showCloseButton ? (
                            <Pressable
                                onPress={onDismiss}
                                hitSlop={8}
                                style={styles.closeButton}
                                accessibilityRole="button"
                                accessibilityLabel="Close dialog"
                            >
                                <Text style={styles.closeText}>×</Text>
                            </Pressable>
                        ) : null}

                        {(title || description) ? (
                            <View style={styles.header}>
                                {title ? (
                                    <Text style={styles.title}>{title}</Text>
                                ) : null}
                                {description ? (
                                    <Text style={styles.description}>{description}</Text>
                                ) : null}
                            </View>
                        ) : null}

                        {children ? (
                            <View style={styles.body}>{children}</View>
                        ) : null}

                        {actions.length ? (
                            <View style={styles.actions}>
                                {actions.map(renderAction)}
                            </View>
                        ) : null}
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

export default Dialog;
