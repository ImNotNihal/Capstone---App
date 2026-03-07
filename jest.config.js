module.exports = {
    preset: "jest-expo",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    transformIgnorePatterns: [
        "node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-ble-plx|react-native-base64)",
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    testMatch: [
        "<rootDir>/src/**/__tests__/**/*.{ts,tsx}",
        "<rootDir>/src/**/*.{test,spec}.{ts,tsx}",
    ],
    collectCoverageFrom: [
        "src/context/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
        "!src/**/__tests__/**",
    ],
};
