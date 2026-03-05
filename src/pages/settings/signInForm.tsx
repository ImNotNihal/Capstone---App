import React, {ReactNode, useState, useContext, useEffect} from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import styles from "./styles";
import {AppContext} from "@/src/context/app-context";
import {useFocusEffect} from "@react-navigation/native";


const SigninForm = () => {
    const [email, setEmail] = useState("benji.ollomo@gmail.com");
    const [password, setPassword] = useState("admin");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {signin, signup} = useContext(AppContext);

    const handleSubmit = async () => {
        setError(null);
        setSubmitting(true);
        try {
            if (mode === "login") {
                await signin(email, password);
            } else {
                await signup({ email, password, firstName, lastName });
            }
        } catch (err: any) {
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "login" ? "signup" : "login"));
        setError(null);
    };
    return (
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
            {mode === "signup" && (
                <>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>First name</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Last name</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>
                </>
            )}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    textContentType="password"
                />
            </View>
            <View>
                <Text style={styles.inputLabel}>{`For testing without server:`}</Text>
                <Text style={styles.inputLabel}>{`email='test', password='test'`}</Text>

            </View>
            {error && <Text style={{ color: "#dc2626", fontWeight: "600" }}>{error}</Text>}
            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleSubmit} disabled={submitting}>
                <Text style={[styles.buttonText, styles.buttonPrimaryText]}>
                    {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={toggleMode} disabled={submitting}>
                <Text style={[styles.buttonText, styles.buttonOutlineText]}>
                    {mode === "login" ? "Need an account? Sign Up" : "Have an account? Sign In"}
                </Text>
            </TouchableOpacity>
        </View>

    )
}

export default SigninForm;