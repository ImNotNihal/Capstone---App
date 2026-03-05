import {TouchableOpacity, Text, View, Image} from "react-native";
import { usePathname, useRouter } from "expo-router";
import styles from "./styles";

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();

    const sections = [
        {
            name: "Home",
            imgSrc: require("../../assets/images/house.png"),
            path: "/",
        }, 
        {
            name: "Events",
            imgSrc: require("../../assets/images/history.png"),
            path: "/events",

        }, 
        {
            name: "Sensors",
            imgSrc: require("../../assets/images/radar.png"),
            path: "/sensors",

        }, 
        {
            name: "Settings",
            imgSrc: require("../../assets/images/settings.png"),
            path: "/settings",
        },
        {
            name: "Testing",
            imgSrc: require("../../assets/images/house.png"),
            path: "/testing",
        }]

    const handleNavigate = (path?: string) => {
        if (!path || pathname === path) return;
        router.push(path);
    };

    return (
        <View style={styles.container}>
            
            {
                sections.map((section, index) =>
                    <TouchableOpacity
                        key={section.name}
                        style={styles.navbarItem}
                        onPress={() => handleNavigate(section.path)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={section.name}
                        accessibilityState={{ selected: pathname === section.path }}
                    >
                        <Image
                            style={[styles.icon, pathname === section.path ? styles.iconActive : styles.iconInactive]}
                            source={section.imgSrc}
                        />
                        <Text style={[styles.label, pathname === section.path ? styles.labelActive : styles.labelInactive]}>
                            {section.name}
                        </Text>
                    </TouchableOpacity>)
            }
        </View>

    )
}

export default Navbar;
