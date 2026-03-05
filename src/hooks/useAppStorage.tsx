/**
 * Cross-platform persistent storage.
 *
 * • Web  – delegates to window.localStorage (synchronous browser API).
 * • Native (iOS / Android / Expo Go) – delegates to AsyncStorage, which
 *   ships as part of Expo Go and requires no native build step.
 *
 * All methods are async so callers work uniformly on every platform.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Web helpers ─────────────────────────────────────────────────────────────

function webGet(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function webSet(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // ignore quota / security errors
    }
}

function webRemove(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

// ─── AppStorage ───────────────────────────────────────────────────────────────

export class AppStorage {
    static async getSession(): Promise<any> {
        let saved: string | null = null;
        if (Platform.OS === 'web') {
            saved = webGet('session');
        } else {
            saved = await AsyncStorage.getItem('session');
        }
        return saved ? JSON.parse(saved) : null;
    }

    static async setSession(session: {
        user: any;
        token: string | null;
        refreshToken?: string | null;
    }): Promise<void> {
        const value = JSON.stringify(session);
        if (Platform.OS === 'web') {
            webSet('session', value);
        } else {
            await AsyncStorage.setItem('session', value);
        }
    }

    static async clearSession(): Promise<void> {
        if (Platform.OS === 'web') {
            webRemove('session');
            webRemove('user');
        } else {
            await AsyncStorage.multiRemove(['session', 'user']);
        }
    }
}

// ─── Hook (kept for backwards compatibility) ──────────────────────────────────

export function useAppStorage() {
    const getUser = async () => {
        if (Platform.OS === 'web') {
            const saved = webGet('user');
            return saved ? JSON.parse(saved) : null;
        }
        const saved = await AsyncStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    };

    const setUser = async (user: any) => {
        const value = JSON.stringify(user);
        if (Platform.OS === 'web') {
            webSet('user', value);
        } else {
            await AsyncStorage.setItem('user', value);
        }
    };

    return { getUser, setUser };
}
