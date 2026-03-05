/* eslint-disable no-bitwise */

/**
 * Bluetooth Low Energy hook.
 *
 * react-native-ble-plx is a native module that is NOT bundled inside Expo Go.
 * To keep the rest of the app functional when running in Expo Go (QR-code
 * scanning), this file uses:
 *
 *   • `import type` for TypeScript types only – erased at compile time, so
 *     the module is never actually loaded by the JS runtime.
 *   • A dynamic `require()` wrapped in try/catch for the actual runtime
 *     instantiation – fails silently in Expo Go and the hook returns no-op
 *     functions throughout the app.
 *
 * Full BLE functionality (connecting to the lock hardware, sending Wi-Fi
 * credentials, etc.) requires a development build:
 *   npx expo run:android   or   npx expo run:ios
 */

import { useCallback, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";

// ─── Type-only imports (erased at build time, safe in Expo Go) ───────────────
import type {
    BleManager as BleManagerType,
    BleError,
    Characteristic,
    Device,
} from "react-native-ble-plx";

// ─── Runtime: load native module only when available ─────────────────────────
const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const COLOR_CHARACTERISTIC_UUID = "19b10001-e8f2-537e-4f6c-d104768a1217";
const LOCK_STATE_CHARACTERISTIC_UUID = "12345678-1234-1234-1234-1234567890ad";
const COMMAND_CHARACTERISTIC_UUID = "12345678-1234-1234-1234-1234567890ac";
const MAC_ADDRESS_CHARACTERISTIC_UUID = "12345678-1234-1234-1234-1234567890ae";
const DEVICE_TTL_MS = 6000;
const PRUNE_INTERVAL_MS = 1000;

let BleManagerClass: any = null;
try {
    BleManagerClass = require("react-native-ble-plx").BleManager;
} catch {
    // BLE native module not available (e.g. Expo Go). All BLE operations will
    // be no-ops and the app continues to work via the cloud API.
}

let bleManager: BleManagerType | null = null;
try {
    if (BleManagerClass) {
        bleManager = new BleManagerClass();
    }
} catch (error) {
    bleManager = null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useBLEInternal() {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [color, setColor] = useState("white");
    const seenDevicesRef = useRef(new Map<string, { device: Device; lastSeen: number }>());
    const pruneTimerRef = useRef<NodeJS.Timeout | null>(null);
    const getBleManager = () => bleManager;

    const decodeValue = (value: string | null | undefined) =>
        value ? base64.decode(value) : "";

    const encodeValue = (value: string) => base64.encode(value);

    const requestAndroid31Permissions = useCallback(async () => {
        const bluetoothScanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );
        const fineLocationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );

        return (
            bluetoothScanPermission === "granted" &&
            bluetoothConnectPermission === "granted" &&
            fineLocationPermission === "granted"
        );
    }, []);

    const requestPermissions = useCallback(async () => {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Bluetooth Low Energy requires Location",
                        buttonPositive: "OK",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                return await requestAndroid31Permissions();
            }
        } else {
            return true;
        }
    }, [requestAndroid31Permissions]);

    const connectToDevice = useCallback(async (device: Device) => {
        if (!bleManager) {
            console.log("BleManager unavailable (Expo Go / web)");
            return;
        }

        try {
            const deviceConnection = await bleManager.connectToDevice(device.id);
            setConnectedDevice(deviceConnection);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();

            startStreamingData(deviceConnection);
        } catch (e) {
            console.log("FAILED TO CONNECT", e);
        }
    }, []);

    const disconnectFromDevice = useCallback(async (deviceId?: string) => {
        if (!bleManager) {
            console.log("BleManager unavailable (Expo Go / web)");
            return;
        }

        const targetId = deviceId || connectedDevice?.id;
        if (!targetId) return;

        try {
            await bleManager.cancelDeviceConnection(targetId);
        } catch (e) {
            console.log("FAILED TO DISCONNECT", e);
        } finally {
            setConnectedDevice(null);
        }
    }, [connectedDevice?.id]);

    const pruneStaleDevices = useCallback(() => {
        const now = Date.now();
        const nextDevices: Device[] = [];

        for (const [id, entry] of seenDevicesRef.current.entries()) {
            if (now - entry.lastSeen <= DEVICE_TTL_MS) {
                nextDevices.push(entry.device);
            } else {
                seenDevicesRef.current.delete(id);
            }
        }

        setAllDevices(nextDevices);
    }, []);

    const resetDevices = useCallback(() => {
        seenDevicesRef.current.clear();
        setAllDevices([]);
    }, []);

    const startPruneTimer = useCallback(() => {
        if (pruneTimerRef.current) return;
        pruneTimerRef.current = setInterval(pruneStaleDevices, PRUNE_INTERVAL_MS);
    }, [pruneStaleDevices]);

    const stopPruneTimer = useCallback(() => {
        if (pruneTimerRef.current) {
            clearInterval(pruneTimerRef.current);
            pruneTimerRef.current = null;
        }
    }, []);

    const scanForPeripherals = useCallback(() => {
        if (!bleManager) {
            console.log("BleManager unavailable (Expo Go / web)");
            return;
        }
        resetDevices();
        bleManager.stopDeviceScan().then(() => {});
        startPruneTimer();

        return bleManager.startDeviceScan(
            null,
            null,
            (error: BleError | null, device: Device | null) => {
                if (error) {
                    console.log(error);
                    return;
                }

                if (!device || !device.id) {
                    return;
                }

                const deviceName = (device.localName || device.name || "").toLowerCase();
                const isEsp = deviceName.includes("lock");
                if (!isEsp) return;

                seenDevicesRef.current.set(device.id, {
                    device,
                    lastSeen: Date.now(),
                });

                pruneStaleDevices();
            }
        );
    }, [pruneStaleDevices, startPruneTimer, resetDevices]);

    const onDataUpdate = (
        error: BleError | null,
        characteristic: Characteristic | null
    ) => {
        if (error) {
            console.log(error);
            return;
        } else if (!characteristic?.value) {
            console.log("No Data was received");
            return;
        }

        const colorCode = decodeValue(characteristic.value);

        let color = "white";
        if (colorCode === "B") {
            color = "blue";
        } else if (colorCode === "R") {
            color = "red";
        } else if (colorCode === "G") {
            color = "green";
        }

        setColor(color);
    };

    const startStreamingData = useCallback(async (device: Device) => {
        if (device) {
            device.monitorCharacteristicForService(
                SERVICE_UUID,
                COLOR_CHARACTERISTIC_UUID,
                onDataUpdate
            );
        } else {
            console.log("No Device Connected");
        }
    }, []);

    const subscribeToLockState = useCallback(async (
        d: Device | null | undefined,
        callback = (_value: string | null | undefined) => {}
    ) => {
        if (!d) {
            console.log("No Device Connected");
            return;
        }

        d.monitorCharacteristicForService(
            SERVICE_UUID,
            LOCK_STATE_CHARACTERISTIC_UUID,
            (error: BleError | null, characteristic: Characteristic | null) => {
                if (error) {
                    console.log("Monitor error:", error);
                    return;
                }

                const decoded = decodeValue(characteristic?.value);
                callback(decoded || "");
            }
        );
    }, []);

    const readMacAddress = useCallback(async (d?: Device) => {
        const target = d || connectedDevice;
        if (!target) return;

        try {
            const char: Characteristic = await target.readCharacteristicForService(
                SERVICE_UUID,
                MAC_ADDRESS_CHARACTERISTIC_UUID
            );

            if (char.value) {
                return decodeValue(char.value);
            }
        } catch (e) {
            console.log("Read error:", e);
        }
    }, [connectedDevice]);

    const readLockState = useCallback(async (d?: Device) => {
        const target = d || connectedDevice;
        if (!target) return;

        try {
            const char: Characteristic = await target.readCharacteristicForService(
                SERVICE_UUID,
                LOCK_STATE_CHARACTERISTIC_UUID
            );

            if (char.value) {
                return decodeValue(char.value);
            }
        } catch (e) {
            console.log("Read error:", e);
        }
    }, [connectedDevice]);

    const sendCommand = useCallback(async (command: string, device = connectedDevice) => {
        if (device) {
            const base64Command = encodeValue(command);

            try {
                await device.writeCharacteristicWithResponseForService(
                    SERVICE_UUID,
                    COMMAND_CHARACTERISTIC_UUID,
                    base64Command
                );
                console.log("Sent command:", command);
            } catch (e) {
                console.log("Ble Write error", e);
            }
        } else {
            console.log("No Device Connected");
        }
    }, [connectedDevice]);

    const stopScan = useCallback(() => {
        if (!bleManager) {
            console.log("BleManager unavailable (Expo Go / web)");
            return;
        }

        bleManager.stopDeviceScan();
        stopPruneTimer();
    }, [stopPruneTimer]);

    return {
        connectToDevice,
        allDevices,
        connectedDevice,
        color,
        requestPermissions,
        scanForPeripherals,
        startStreamingData,
        resetDevices,
        stopScan,
        getBleManager,
        sendCommand,
        disconnectFromDevice,
        subscribeToLockState,
        readLockState,
        SERVICE_UUID,
        COLOR_CHARACTERISTIC_UUID,
        LOCK_STATE_CHARACTERISTIC_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        readMacAddress,
    };
}

export default useBLEInternal;
