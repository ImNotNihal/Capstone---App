import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ImageBackground,
    useWindowDimensions,
    ScrollView,
    Animated,
    StyleSheet,
} from "react-native";
import {AppContext} from "../../context/app-context";
import {useContext} from "react";
import {useRouter} from "expo-router";
import {WebView} from "react-native-webview";
import {useFocusEffect} from "@react-navigation/native";
import {Platform} from 'react-native';
import styles from './styles';
import { Dimensions } from "react-native";
const { width } = Dimensions.get("window");


export default function Home() {
    const {user, deviceId, httpLock, httpUnlock, isLocked} = useContext(AppContext);
    const router = useRouter();
    // const [isLocked, setIsLocked] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [lastActivities, setLastActivities] = useState([]); // placeholder if you later make this dynamic

    const toggleLock = () => isLocked ? httpUnlock() : httpLock();
    const toggleCall = () => setIsCallActive((prev) => !prev);

    useEffect(() => {
        // console.log("User:", user);
        // console.log("Device ID:", deviceId);
    }, []);

    if (!user) {
        return (
            <View style={authStyles.container}>
                <Text style={authStyles.title}>You are not logged in</Text>
                <Text style={authStyles.subtitle}>Log in from Settings to use the app.</Text>
                <TouchableOpacity
                    onPress={() => router.push("/settings")}
                    style={authStyles.button}
                >
                    <Text style={authStyles.buttonText}>Go to Settings</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <ScrollView style={{ flex: 1, flexDirection: "column" }}>
            {/* Header */}
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#e4e4e7" }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "600" }}>Front Door</Text>
                    <LockedStatus locked={isLocked} />
                </View>
                <Text style={{ color: "#6b7280" }}>Live View</Text>
            </View>

            {/* Live Camera Feed */}
            <CameraFeed isCallActive={isCallActive} />

            {/* Quick Actions + Status Cards */}
            <View style={{ padding: 16, flex: 1 }}>
                {/* Quick Actions (2-column grid) */}
                <View
                    style={{
                        flexDirection: "row",
                        marginBottom: 16,
                    }}
                >
                    <LockButton locked={isLocked} onLockCallback={toggleLock} />
                    <StartCallButton callActive={isCallActive} onStartCallCallback={toggleCall} />
                </View>

                {/* Status Cards */}
                <View style={{ rowGap: 12 }}>
                    {/* Last Activity Card */}
                    <View
                        style={{
                            padding: 16,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            backgroundColor: "white",
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                    style={{
                                        backgroundColor: "rgba(59,130,246,0.12)",
                                        padding: 8,
                                        borderRadius: 12,
                                        marginRight: 12,
                                    }}
                                >
                                    {/* Bell Icon */}
                                    <Image
                                        source={require("../../assets/images/bell.png")}
                                        style={{ width: 20, height: 20, tintColor: "#2563eb" }}
                                    />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 14 }}>Last Activity</Text>
                                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                                        Motion detected • 5 min ago
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Access Card */}
                    <View
                        style={{
                            padding: 16,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            backgroundColor: "white",
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600" }}>Quick Access</Text>
                        </View>

                        <View style={{ rowGap: 8 }}>
                            {/* John Doe row */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: 8,
                                    borderRadius: 10,
                                    backgroundColor: "#f4f4f5",
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: "#2563eb",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            marginRight: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: "white",
                                                fontWeight: "600",
                                                fontSize: 12,
                                            }}
                                        >
                                            JD
                                        </Text>
                                    </View>
                                    <Text>John Doe (Face ID)</Text>
                                </View>
                                <BadgeOutline>Active</BadgeOutline>
                            </View>

                            {/* Sarah Miller row */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: 8,
                                    borderRadius: 10,
                                    backgroundColor: "#f4f4f5",
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: "#e5e7eb",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            marginRight: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: "#111827",
                                                fontWeight: "600",
                                                fontSize: 12,
                                            }}
                                        >
                                            SM
                                        </Text>
                                    </View>
                                    <Text>Sarah Miller (Bluetooth)</Text>
                                </View>
                                <BadgeOutline>Active</BadgeOutline>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

/* Camera Feed with overlays */
const CameraFeed = ({ isCallActive }: { isCallActive: boolean }) => {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 800;
    const {cameraBaseUrl, isWebBrowser, authToken} = useContext(AppContext);
    const [source, setSource] = useState("");
    const [webViewKey, setWebViewKey] = useState(0);
    const upscale = 2;
    
    useFocusEffect(
        useCallback(() => {
            // Force WebView to refresh its connection every time the screen gains focus.
            if (cameraBaseUrl) {
                console.log("Setting camera source to:", cameraBaseUrl);
                setSource(`${cameraBaseUrl}/stream?ts=${Date.now()}`);
                setWebViewKey((prev) => prev + 1);
            }
            return () => {
                setSource("");
            };
        }, [cameraBaseUrl])
    );

    const height = (width * 9) / 16;
    
    
    return (
        <View style={{ backgroundColor: "black" }}>
            <View
                style={{
                    marginHorizontal: 16,
                    marginVertical: 16,
                    borderRadius: 12,
                    overflow: "hidden",
                    alignSelf: "center",
                    width: "100%",
                    maxWidth: isLargeScreen ? 900 : "100%",
                }}
            >
                <View style={{ width: "100%", flex: 3, aspectRatio: 16 / 9, overflow: "hidden" }}>
                    {source ? (
                        isWebBrowser ?
                            <img
                                src={source}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    transform: `scale(${upscale})`,
                                    transformOrigin: "center",
                                    imageRendering: "pixelated",
                                }}
                                // sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                             alt={"camera feed"}/>
                            :
                            <WebView
                                key={webViewKey}
                                source={{
                                    uri: source,
                                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                                }}
                                scalesPageToFit={true}
                                style={{flex: 1, transform: [{ scale: upscale }]}}
                                javaScriptEnabled
                                domStorageEnabled
                            />
                    ) : (
                        <ImageBackground
                            source={require("../../assets/images/camera-feed-test.png")}
                            style={{flex: 1}}
                            imageStyle={{resizeMode: "cover"}}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

/* Overlay circular icon button (camera / video) */
const OverlayIconButton = ({ icon }: { icon: any }) => {
    return (
        <TouchableOpacity
            style={{
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: 8,
                borderRadius: 999,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Image
                source={icon}
                style={{ width: 16, height: 16, tintColor: "white" }}
            />
        </TouchableOpacity>
    );
};

/* Quick Actions */

const StartCallButton = ({
                             callActive,
                             onStartCallCallback,
                         }: {
    callActive: boolean;
    onStartCallCallback: () => void;
}) => {
    const micIcon = require("../../assets/images/mic.png");
    const phoneIcon = require("../../assets/images/phone.png");

    const backgroundColor = callActive ? "#ef4444" : "transparent";
    const borderColor = callActive ? "#ef4444" : "#d4d4d8";
    const textColor = callActive ? "white" : "#111827";

    return (
        <TouchableOpacity
            onPress={onStartCallCallback}
            style={{
                flex: 1,
                height: 80,
                marginLeft: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                backgroundColor,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
            <Image
                source={callActive ? phoneIcon : micIcon}
                style={{ width: 24, height: 24, marginBottom: 6, tintColor: textColor }}
            />
            <Text style={{ color: textColor, fontWeight: "600", fontSize: 14 }}>
                {callActive ? "End Call" : "Start Call"}
            </Text>
        </TouchableOpacity>
    );
};

const LockButton = ({
                        locked,
                        onLockCallback,
                    }: {
    locked: boolean;
    onLockCallback: () => void;
}) => {
    const lockedIcon = require("../../assets/images/lock.png");
    const unlockedIcon = require("../../assets/images/lock-open.png");

    // In the web version:
    // - when locked: variant="default" (primary), show Unlock icon, text "Unlock Door"
    // - when unlocked: variant="destructive", show Lock icon, text "Lock Door"
    const backgroundColor = locked ? "#111827" : "#ef4444";
    const text = locked ? "Unlock Door" : "Lock Door";
    const icon = locked ? unlockedIcon : lockedIcon;

    return (
        <TouchableOpacity
            onPress={onLockCallback}
            style={{
                flex: 1,
                height: 80,
                marginRight: 6,
                borderRadius: 12,
                backgroundColor,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
            <Image
                source={icon}
                style={{ width: 24, height: 24, marginBottom: 6, tintColor: "white" }}
            />
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>{text}</Text>
        </TouchableOpacity>
    );
};

/* Locked status badge (top-right in header) */
const LockedStatus = ({ locked }: { locked: boolean }) => {
    const lockedIcon = require("../../assets/images/lock.png");
    const unlockedIcon = require("../../assets/images/lock-open.png");

    const bgColor = locked ? "#ef4444" : "#e5e7eb";
    const textColor = locked ? "white" : "#111827";
    const iconTint = locked ? "white" : "#111827";

    return (
        <View
            style={{
                backgroundColor: bgColor,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <Image
                source={locked ? lockedIcon : unlockedIcon}
                style={{
                    width: 14,
                    height: 14,
                    marginRight: 4,
                    tintColor: iconTint,
                }}
            />
            <Text style={{ color: textColor, fontWeight: "600", fontSize: 12 }}>
                {locked ? "Locked" : "Unlocked"}
            </Text>
        </View>
    );
};

/* LIVE badge (top-left in camera) */
const LiveBadge = () => {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 0.3,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulse]);

    return (
        <View
            style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: "#ef4444", // destructive
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <Animated.View
                style={{
                    width: 8,
                    height: 8,
                    backgroundColor: "white",
                    borderRadius: 999,
                    marginRight: 4,
                    opacity: pulse,
                }}
            />
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>LIVE</Text>
        </View>
    );
};

/* Outline badge for "Active" labels */
const BadgeOutline = ({ children }: { children: React.ReactNode }) => {
    return (
        <View
            style={{
                borderWidth: 1,
                borderColor: "#d4d4d8",
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 2,
            }}
        >
            <Text style={{ fontSize: 12, color: "#111827" }}>{children}</Text>
        </View>
    );
};

const authStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#fff",
        rowGap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
    },
    button: {
        marginTop: 4,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: "#111827",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
    },
});
