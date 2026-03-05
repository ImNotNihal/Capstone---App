import React, {useEffect, useRef, useState, useCallback, useContext} from "react";
import {useFocusEffect} from "@react-navigation/native";

import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ImageBackground,
    useWindowDimensions,
    ScrollView,
    Animated,
} from "react-native";

import {useBLE} from "@/src/context/ble-context";
import {AppContext} from "@/src/context/app-context";

const base_url = "https://0dae5b628806.ngrok-free.app/";

const DEVICE_ID = "smartlock_D0DB64A84320";
export default function Testing() {
    const { authToken } = useContext(AppContext);
    const {
        allDevices,
        connectedDevice,
        connectToDevice,
        disconnectFromDevice,
        requestPermissions,
        scanForPeripherals,
        stopScan,
        readLockState,
        readMacAddress,
    } = useBLE();

    const [isLocked, setIsLocked] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);

    const authHeaders = useCallback(() => {
        const headers: Record<string, string> = {};
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }
        return headers;
    }, [authToken]);

    const httpLock = () => {
        const url = `${base_url}send-command/${DEVICE_ID}/LOCK`;
        return fetch(url, {method: "POST", headers: authHeaders()});
    };

    const httpUnlock = () => {
        const url = `${base_url}send-command/${DEVICE_ID}/UNLOCK`;
        return fetch(url, {method: "POST", headers: authHeaders()});
    };
    
    const httpGetLockStatus = () => {
        const url = `${base_url}status/${DEVICE_ID}`;
        return fetch(url, {method: "GET", headers: authHeaders()})
            .then((response) => response.json())
            .then((data) => {
                const status = data?.status;
                if (typeof status === "string") {
                    setIsLocked(status === "LOCKED");
                }
                return data;
            })
            .catch((e) => {
                console.log("Status fetch error:", e);
            });
    };

    const toggleLock = () => {
        const command = isLocked ? "UNLOCK" : "LOCK";
        if (command === "LOCK") {
            httpLock();
        } else {
            httpUnlock();
        }
    };

    const toggleCall = () => setIsCallActive((prev) => !prev);

    // -------- WebSocket for realtime status from server --------

    useFocusEffect(
        useCallback(() => {
            // Derive WS URL from base_url
            const wsUrl = (base_url || "")
                .replace(/^http:\/\//, "ws://")
                .replace(/^https:\/\//, "wss://") + "ws/client";

            console.log("Connecting WS client to:", wsUrl);

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Client WS connected");
                // Subscribe to this device's status feed
                const subMsg = JSON.stringify({
                    type: "subscribe",
                    deviceId: DEVICE_ID,
                });
                ws.send(subMsg);

                // Optionally fetch status once via HTTP as initial value
                httpGetLockStatus();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Expect messages like:
                    // { type: "status", deviceId: "...", status: "LOCKED" }
                    if (data.type === "status" && data.deviceId === DEVICE_ID) {
                        if (typeof data.status === "string") {
                            setIsLocked(data.status === "LOCKED");
                        }
                    }
                } catch (e) {
                    console.log("WS message parse error:", e);
                }
            };

            ws.onerror = (event) => {
                console.log("WS error:", event);
            };

            ws.onclose = (event) => {
                console.log("Client WS closed:", event?.code, event?.reason);
                wsRef.current = null;
            };

            return () => {
                console.log("Cleaning up WS");
                if (wsRef.current) {
                    wsRef.current.close();
                    wsRef.current = null;
                }
            };
        }, [])
    );

    // -------- BLE scanning (local mode, unchanged) --------

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const start = async () => {
                const ok = await requestPermissions();
                if (!ok || cancelled) return;
                scanForPeripherals();
            };

            start();

            return () => {
                cancelled = true;
                stopScan();
            };
        }, [requestPermissions, scanForPeripherals, stopScan])
    );

    // When connected via BLE, keep local lock state updated (optional)
    useEffect(() => {
        if (!connectedDevice) return;
        readMacAddress().then((value) => {
            console.log(`Connected BLE to ${value}`);
        });

        const interval = setInterval(() => {
            readLockState().then((value) => {
                if (!value) return;
                setIsLocked(value === "LOCKED");
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [connectedDevice, readLockState, readMacAddress]);

    function deviceHasName(device: any) {
        const name = (device.name || "").trim();
        const localName = (device.localName || "").trim();
        return Boolean(name || localName);
    }

    useEffect(() => {
    }, []);
    // -------- UI (unchanged) --------

    return (
        <ScrollView style={{flex: 1, flexDirection: "column"}}>
            {/* Header */}
            <View style={{padding: 16, borderBottomWidth: 1, borderColor: "#e4e4e7"}}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <Text style={{fontSize: 18, fontWeight: "600"}}>Front Door</Text>
                    <LockedStatus locked={isLocked}/>
                </View>
                <Text style={{color: "#6b7280"}}>Helloll</Text>
            </View>

            <View style={{padding: 16, flex: 1}}>
                {/* Quick Actions */}
                <View style={{flexDirection: "row", marginBottom: 16}}>
                    <LockButton locked={isLocked} onLockCallback={toggleLock}/>
                    <StartCallButton callActive={isCallActive} onStartCallCallback={toggleCall}/>
                </View>

                {/* Discovered devices */}
                <View style={{marginTop: 8}}>
                    <Text style={{fontSize: 16, fontWeight: "600", marginBottom: 8}}>
                        Available Devices
                    </Text>
                    {allDevices.length === 0 ? (
                        <Text style={{color: "#6b7280"}}>No devices found yet.</Text>
                    ) : (
                        allDevices
                            .filter((device) => deviceHasName(device))
                            .map((device) => {
                                const isConnected = connectedDevice?.id === device.id;
                                return (
                                    <View
                                        key={device.id}
                                        style={{
                                            padding: 12,
                                            marginBottom: 8,
                                            borderWidth: 1,
                                            borderColor: "#e4e4e7",
                                            borderRadius: 10,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <View style={{flexShrink: 1}}>
                                            <Text style={{fontWeight: "600"}}>
                                                {device.name || device.localName || "Unnamed device"}
                                            </Text>
                                            <Text style={{color: "#6b7280"}} numberOfLines={1}>
                                                {device.id}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() =>
                                                isConnected
                                                    ? disconnectFromDevice(device.id)
                                                    : connectToDevice(device)
                                            }
                                            style={{
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                backgroundColor: isConnected ? "#ef4444" : "#111827",
                                            }}
                                        >
                                            <Text style={{color: "white", fontWeight: "600"}}>
                                                {isConnected ? "Disconnect" : "Connect"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

/* Camera Feed with overlays */
const CameraFeed = ({isCallActive}: { isCallActive: boolean }) => {
    const {width} = useWindowDimensions();
    const isLargeScreen = width > 800;

    return (
        <View style={{backgroundColor: "black"}}>
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
                {/* 16:9 aspect ratio wrapper */}
                <View style={{width: "100%", aspectRatio: 16 / 9}}>
                    <ImageBackground
                        source={require("../../assets/images/camera-feed-test.png")}
                        style={{flex: 1}}
                        imageStyle={{resizeMode: "cover"}}
                    >
                        {/* Live badge */}
                        <LiveBadge/>

                        {/* Camera Controls Overlay (top-right) */}
                        <View
                            style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                flexDirection: "row",
                            }}
                        >
                            <OverlayIconButton
                                icon={require("../../assets/images/camera.png")}
                            />
                            <View style={{width: 8}}/>
                            <OverlayIconButton
                                icon={require("../../assets/images/video.png")}
                            />
                        </View>

                        {/* Call Active Overlay */}
                        {isCallActive && (
                            <View
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: "rgba(0,0,0,0.4)",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <View style={{alignItems: "center"}}>
                                    <Image
                                        source={require("../../assets/images/volume.png")}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            marginBottom: 8,
                                            tintColor: "white",
                                        }}
                                    />
                                    <Text
                                        style={{
                                            color: "white",
                                            fontSize: 16,
                                            textAlign: "center",
                                        }}
                                    >
                                        Two-way call active
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ImageBackground>
                </View>
            </View>
        </View>
    );
};

/* Overlay circular icon button (camera / video) */
const OverlayIconButton = ({icon}: { icon: any }) => {
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
                style={{width: 16, height: 16, tintColor: "white"}}
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
                style={{width: 24, height: 24, marginBottom: 6, tintColor: textColor}}
            />
            <Text style={{color: textColor, fontWeight: "600", fontSize: 14}}>
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
                style={{width: 24, height: 24, marginBottom: 6, tintColor: "white"}}
            />
            <Text style={{color: "white", fontWeight: "600", fontSize: 14}}>{text}</Text>
        </TouchableOpacity>
    );
};

/* Locked status badge (top-right in header) */
const LockedStatus = ({locked}: { locked: boolean }) => {
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
            <Text style={{color: textColor, fontWeight: "600", fontSize: 12}}>
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
            <Text style={{color: "white", fontSize: 12, fontWeight: "600"}}>LIVE</Text>
        </View>
    );
};

/* Outline badge for "Active" labels */
const BadgeOutline = ({children}: { children: React.ReactNode }) => {
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
            <Text style={{fontSize: 12, color: "#111827"}}>{children}</Text>
        </View>
    );
};
