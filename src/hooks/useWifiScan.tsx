/**
 * Hook that scans for nearby WiFi networks using react-native-wifi-reborn.
 *
 * - Android: uses loadWifiList() after requesting ACCESS_FINE_LOCATION.
 * - iOS / Web: WiFi scanning is not available; returns an empty list so the
 *   caller can fall back to manual SSID entry.
 */

import { useCallback, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

export interface WifiNetwork {
    SSID: string;
    /** Signal level in dBm (Android only) */
    level?: number;
}

export function useWifiScan() {
    const [networks, setNetworks] = useState<WifiNetwork[]>([]);
    const [scanning, setScanning] = useState(false);

    const scan = useCallback(async () => {
        if (Platform.OS !== 'android') {
            // iOS does not permit WiFi scanning from third-party apps.
            setNetworks([]);
            return;
        }

        // Ensure location permission (required for WiFi scan on Android)
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'Location access is needed to scan nearby Wi-Fi networks.',
                    buttonPositive: 'OK',
                },
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                setNetworks([]);
                return;
            }
        } catch {
            setNetworks([]);
            return;
        }

        setScanning(true);
        try {
            const list = await WifiManager.loadWifiList();

            // Deduplicate by SSID (keep strongest signal) and filter out hidden networks
            const seen = new Map<string, WifiNetwork>();
            for (const item of list) {
                const ssid = (item as any).SSID ?? '';
                if (!ssid) continue;
                const level = (item as any).level ?? (item as any).RSSI ?? -100;
                const existing = seen.get(ssid);
                if (!existing || (existing.level ?? -100) < level) {
                    seen.set(ssid, { SSID: ssid, level });
                }
            }

            // Sort by signal strength (strongest first)
            const unique = Array.from(seen.values()).sort(
                (a, b) => (b.level ?? -100) - (a.level ?? -100),
            );
            setNetworks(unique);
        } catch (e) {
            console.warn('[useWifiScan] scan failed:', e);
            setNetworks([]);
        } finally {
            setScanning(false);
        }
    }, []);

    return { networks, scanning, scan };
}
