// Mock AsyncStorage (native module not available in Jest)
jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock react-native-base64 using Node's built-in Buffer
jest.mock("react-native-base64", () => ({
    encode: (str) => Buffer.from(str, "utf-8").toString("base64"),
    decode: (str) => Buffer.from(str, "base64").toString("utf-8"),
}));

// Mock expo-device
jest.mock("expo-device", () => ({
    platformApiLevel: 33,
}));

// Mock react-native-ble-plx (native module unavailable in Jest)
jest.mock("react-native-ble-plx", () => ({
    BleManager: jest.fn().mockImplementation(() => ({
        startDeviceScan: jest.fn(),
        stopDeviceScan: jest.fn().mockResolvedValue(undefined),
        connectToDevice: jest.fn(),
        cancelDeviceConnection: jest.fn(),
    })),
}));
