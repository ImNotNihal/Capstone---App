import { TouchableOpacity, Text, View, Image } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useContext } from "react";
import { AppContext } from "@/src/context/app-context";
import { useTheme } from "@/src/context/theme-context";

const Navbar = () => {
    const router   = useRouter();
    const pathname = usePathname();
    const { isDevMode } = useContext(AppContext);
    const { colors }    = useTheme();

    const sections = [
        { name: "Home",     imgSrc: require("../../assets/images/house.png"),   path: "/" },
        { name: "Events",   imgSrc: require("../../assets/images/history.png"), path: "/events" },
        { name: "Sensors",  imgSrc: require("../../assets/images/radar.png"),   path: "/sensors" },
        { name: "Settings", imgSrc: require("../../assets/images/settings.png"),path: "/settings" },
        { name: "Testing",  imgSrc: require("../../assets/images/house.png"),   path: "/testing" },
        ...(isDevMode ? [{ name: "Logs", imgSrc: require("../../assets/images/history.png"), path: "/logs" }] : []),
    ];

    const handleNavigate = (path?: string) => {
        if (!path || pathname === path) return;
        router.push(path);
    };

    return (
        <View style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            height: 64,
            width: "100%",
            backgroundColor: colors.navBg,
            borderTopWidth: 1,
            borderTopColor: colors.navBorder,
        }}>
            {sections.map((section) => {
                const isActive = pathname === section.path;
                return (
                    <TouchableOpacity
                        key={section.name}
                        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                        onPress={() => handleNavigate(section.path)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={section.name}
                        accessibilityState={{ selected: isActive }}
                    >
                        <Image
                            style={{
                                width: 20,
                                height: 20,
                                resizeMode: "contain",
                                marginBottom: 4,
                                tintColor: isActive ? colors.navIconActive : colors.navIcon,
                            }}
                            source={section.imgSrc}
                        />
                        <Text style={{
                            textAlign: "center",
                            fontSize: 11,
                            color: isActive ? colors.navActive : colors.navInactive,
                            fontWeight: isActive ? "700" : "500",
                        }}>
                            {section.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default Navbar;
