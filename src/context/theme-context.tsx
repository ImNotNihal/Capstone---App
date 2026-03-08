import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const THEME_KEY = "app_theme";

export type ColorScheme = "dark" | "light";

export const darkColors = {
    bg:           "#050505",
    bgCard:       "#09090B",
    bgSubtle:     "#0A0A0A",
    border:       "#18181B",
    borderLight:  "#27272A",
    text:         "#FAFAFA",
    textSecond:   "#A1A1AA",
    textTertiary: "#71717A",
    textMuted:    "#52525B",
    accent:       "#2563eb",
    navBg:        "#09090B",
    navBorder:    "#18181B",
    navActive:    "#FAFAFA",
    navInactive:  "#52525B",
    navIcon:      "#3F3F46",
    navIconActive:"#2563eb",
    shellBg:      "#050505",
};

export const lightColors = {
    bg:           "#F4F4F5",
    bgCard:       "#FFFFFF",
    bgSubtle:     "#FAFAFA",
    border:       "#E4E4E7",
    borderLight:  "#D4D4D8",
    text:         "#09090B",
    textSecond:   "#3F3F46",
    textTertiary: "#71717A",
    textMuted:    "#A1A1AA",
    accent:       "#2563eb",
    navBg:        "#FFFFFF",
    navBorder:    "#E4E4E7",
    navActive:    "#09090B",
    navInactive:  "#A1A1AA",
    navIcon:      "#A1A1AA",
    navIconActive:"#2563eb",
    shellBg:      "#F4F4F5",
};

type ThemeContextType = {
    colorScheme: ColorScheme;
    colors: typeof darkColors;
    isDark: boolean;
    toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
    colorScheme: "dark",
    colors: darkColors,
    isDark: true,
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [colorScheme, setColorScheme] = useState<ColorScheme>("dark");

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then((stored) => {
            if (stored === "light" || stored === "dark") setColorScheme(stored);
        });
    }, []);

    const toggleTheme = () => {
        setColorScheme((prev) => {
            const next: ColorScheme = prev === "dark" ? "light" : "dark";
            AsyncStorage.setItem(THEME_KEY, next);
            return next;
        });
    };

    const colors = colorScheme === "dark" ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ colorScheme, colors, isDark: colorScheme === "dark", toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
