/**
 * Location permission helper.
 *
 * Uses React Native's built-in PermissionsAndroid (Android) instead of the
 * third-party react-native-permissions package, so no extra native linking is
 * required and the hook works in Expo Go out of the box.
 *
 * NOTE: This hook is not used by the active BLE code (useBLE.tsx handles its
 * own permissions inline).  It is kept here as a standalone utility for
 * future use.
 */

import { PermissionsAndroid, Platform } from 'react-native';

const useHandleLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
        // iOS location permission for BLE is handled automatically by the OS
        // when react-native-ble-plx first scans; no explicit request needed.
        return true;
    }

    // Android
    try {
        const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location Permission',
                message: 'Bluetooth Low Energy requires Location access.',
                buttonPositive: 'OK',
            }
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
};

export default useHandleLocationPermission;
