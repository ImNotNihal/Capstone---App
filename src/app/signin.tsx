import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AppContext } from "../context/app-context";

export default function SignInPage() {
    const { signin, signup } = useContext(AppContext);
    const router = useRouter();

    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail]         = useState("");
    const [password, setPassword]   = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName]   = useState("");
    const [showPass, setShowPass]   = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState<string | null>(null);

    // Entry animations
    const logoAnim    = useRef(new Animated.Value(0)).current;
    const formAnim    = useRef(new Animated.Value(0)).current;
    const formSlide   = useRef(new Animated.Value(40)).current;
    // Mode switch animation
    const modeAnim    = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(120, [
            Animated.timing(logoAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.parallel([
                Animated.timing(formAnim,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(formSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
        ]).start();
    }, [logoAnim, formAnim, formSlide]);

    const handleSubmit = async () => {
        setError(null);
        if (!email.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        if (mode === "signup" && (!firstName.trim() || !lastName.trim())) {
            setError("Please fill in your name.");
            return;
        }
        setSubmitting(true);
        try {
            if (mode === "login") {
                await signin(email.trim(), password);
            } else {
                await signup({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() });
            }
            // AppContext will set user; root layout will redirect away from signin
        } catch (err: any) {
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const switchMode = () => {
        setMode((prev) => (prev === "login" ? "signup" : "login"));
        setError(null);
        Animated.sequence([
            Animated.timing(modeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(modeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();
    };

    const inputOpacity = modeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Logo / Brand */}
                <Animated.View style={[styles.brand, { opacity: logoAnim, transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
                    <View style={styles.logoRing}>
                        <MaterialCommunityIcons name="lock-smart" size={36} color="#2563eb" />
                    </View>
                    <Text style={styles.appName}>SmartLock</Text>
                    <Text style={styles.tagline}>Secure. Smart. Simple.</Text>
                </Animated.View>

                {/* Form Card */}
                <Animated.View style={[styles.card, { opacity: formAnim, transform: [{ translateY: formSlide }] }]}>
                    <Text style={styles.cardTitle}>
                        {mode === "login" ? "Welcome back" : "Create account"}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                        {mode === "login"
                            ? "Sign in to manage your smart lock"
                            : "Set up your SmartLock account"}
                    </Text>

                    <Animated.View style={{ opacity: inputOpacity, gap: 12 }}>
                        {mode === "signup" && (
                            <View style={styles.nameRow}>
                                <View style={[styles.inputWrap, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>First name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="Jane"
                                        placeholderTextColor="#3F3F46"
                                        autoCapitalize="words"
                                    />
                                </View>
                                <View style={[styles.inputWrap, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Last name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Doe"
                                        placeholderTextColor="#3F3F46"
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>
                        )}

                        <View style={styles.inputWrap}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputRow}>
                                <MaterialCommunityIcons name="email-outline" size={18} color="#52525B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.inputWithIcon]}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#3F3F46"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrap}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputRow}>
                                <MaterialCommunityIcons name="lock-outline" size={18} color="#52525B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.inputWithIcon, { flex: 1 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="#3F3F46"
                                    secureTextEntry={!showPass}
                                    textContentType="password"
                                />
                                <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                                    <MaterialCommunityIcons
                                        name={showPass ? "eye-off-outline" : "eye-outline"}
                                        size={18}
                                        color="#52525B"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>

                    {error && (
                        <View style={styles.errorBox}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.btn, submitting && styles.btnDisabled]}
                        onPress={handleSubmit}
                        activeOpacity={0.85}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.btnText}>
                                {mode === "login" ? "Sign In" : "Create Account"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity style={styles.switchBtn} onPress={switchMode} disabled={submitting}>
                        <Text style={styles.switchText}>
                            {mode === "login" ? "Don\u2019t have an account? " : "Already have an account? "}
                            <Text style={styles.switchLink}>
                                {mode === "login" ? "Sign Up" : "Sign In"}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Dev hint */}
                <Animated.View style={[styles.devHint, { opacity: formAnim }]}>
                    <Text style={styles.devHintText}>Test mode: email &quot;test&quot; / password &quot;test&quot;</Text>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#050505",
    },
    scroll: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 60,
        gap: 32,
    },
    brand: {
        alignItems: "center",
        gap: 12,
    },
    logoRing: {
        width: 80,
        height: 80,
        borderRadius: 28,
        backgroundColor: "#0F172A",
        borderWidth: 1,
        borderColor: "#1E3A5F",
        justifyContent: "center",
        alignItems: "center",
    },
    appName: {
        color: "#FAFAFA",
        fontSize: 30,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    tagline: {
        color: "#52525B",
        fontSize: 14,
        fontWeight: "500",
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: "#09090B",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#18181B",
        padding: 24,
        gap: 16,
    },
    cardTitle: {
        color: "#FAFAFA",
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        color: "#71717A",
        fontSize: 14,
        marginTop: -8,
    },
    nameRow: {
        flexDirection: "row",
        gap: 12,
    },
    inputWrap: {
        gap: 6,
    },
    inputLabel: {
        color: "#A1A1AA",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#050505",
        borderWidth: 1,
        borderColor: "#27272A",
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 50,
        color: "#FAFAFA",
        fontSize: 15,
    },
    inputWithIcon: {
        flex: 1,
    },
    eyeBtn: {
        padding: 4,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EF444415",
        borderWidth: 1,
        borderColor: "#EF444430",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 13,
        flex: 1,
    },
    btn: {
        backgroundColor: "#2563eb",
        height: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#18181B",
    },
    dividerText: {
        color: "#3F3F46",
        fontSize: 12,
        fontWeight: "600",
    },
    switchBtn: {
        alignItems: "center",
        paddingVertical: 4,
    },
    switchText: {
        color: "#71717A",
        fontSize: 14,
    },
    switchLink: {
        color: "#2563eb",
        fontWeight: "700",
    },
    devHint: {
        alignItems: "center",
    },
    devHintText: {
        color: "#27272A",
        fontSize: 12,
    },
});
