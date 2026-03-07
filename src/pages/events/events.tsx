import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Easing,
    ImageBackground,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { AppContext } from "../../context/app-context";
import SigninForm from "../settings/signInForm";

type EventCategory = "doorbell" | "access" | "motion";

type EventItem = {
    id: string;
    category: EventCategory;
    title: string;
    description: string;
    date: string; 
    time: string;
    icon: any;
    tint: string;
    videoDuration: string;
    thumbnail: any; 
};

const filterOptions: { label: string; value: "all" | EventCategory }[] = [
    { label: "All Activity", value: "all" },
    { label: "Doorbell", value: "doorbell" },
    { label: "Access", value: "access" },
    { label: "Motion", value: "motion" },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const eventItems: EventItem[] = [
    { id: "1", category: "doorbell", title: "Doorbell Rung", description: "Visitor at front door", date: today, time: "2:15 PM", icon: "bell-ring", tint: "#F59E0B", videoDuration: "0:45", thumbnail: require("../../assets/images/camera-feed-test.png") },
    { id: "2", category: "access", title: "Door Unlocked", description: "Benji - Face Recognition", date: today, time: "2:05 PM", icon: "face-recognition", tint: "#10B981", videoDuration: "0:12", thumbnail: require("../../assets/images/camera-feed-test.png") },
    { id: "3", category: "motion", title: "Motion Detected", description: "Front door PIR sensor", date: today, time: "1:44 PM", icon: "walk", tint: "#8B5CF6", videoDuration: "1:20", thumbnail: require("../../assets/images/camera-feed-test.png") },
    { id: "4", category: "access", title: "Door Locked", description: "Auto-locked after 5 mins", date: today, time: "9:00 AM", icon: "lock", tint: "#10B981", videoDuration: "0:08", thumbnail: require("../../assets/images/camera-feed-test.png") },
    { id: "5", category: "access", title: "Door Unlocked", description: "Sarah - Fingerprint", date: yesterday, time: "6:15 PM", icon: "fingerprint", tint: "#10B981", videoDuration: "0:15", thumbnail: require("../../assets/images/camera-feed-test.png") },
    { id: "6", category: "doorbell", title: "Failed Access Attempt", description: "Unrecognized person", date: yesterday, time: "8:45 PM", icon: "shield-alert-outline", tint: "#EF4444", videoDuration: "2:30", thumbnail: require("../../assets/images/camera-feed-test.png") },
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export default function Events() {
    const { user } = useContext(AppContext);
    const router = useRouter();

    const [selectedFilter, setSelectedFilter] = useState<"all" | EventCategory>("all");
    const [selectedDate, setSelectedDate] = useState<string | null>(today);
    
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedVideoEvent, setSelectedVideoEvent] = useState<EventItem | null>(null);

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (user) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true })
            ]).start();
        }
    }, [user]);

    const filteredEvents = useMemo(() => {
        return eventItems.filter((evt) => {
            const matchesFilter = selectedFilter === "all" || evt.category === selectedFilter;
            const matchesDate = selectedDate ? evt.date === selectedDate : true;
            return matchesFilter && matchesDate;
        });
    }, [selectedFilter, selectedDate]);

    const getDisplayDate = () => {
        if (!selectedDate) return "All Dates";
        if (selectedDate === today) return "Today";
        if (selectedDate === yesterday) return "Yesterday";
        return selectedDate;
    };

    const generateCalendarGrid = () => {
        const days = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const grid = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let i = 1; i <= days; i++) grid.push(i);
        return grid;
    };

    const changeMonth = (offset: number) => {
        let newMonth = currentMonth + offset;
        let newYear = currentYear;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        else if (newMonth < 0) { newMonth = 11; newYear--; }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#050505" }}>
                <View style={styles.authContainer}>
                    <SigninForm />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />


            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filterOptions.map((option) => {
                        const isActive = selectedFilter === option.value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setSelectedFilter(option.value)}
                                style={[styles.filterPill, isActive && styles.filterPillActive]}
                            >
                                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* --- DYNAMIC DATE PILL --- */}
                    <TouchableOpacity
                        onPress={() => setIsCalendarOpen(true)}
                        style={[
                            styles.filterPill, 
                            selectedDate !== null && styles.filterPillActive
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons 
                                name="calendar-month" 
                                size={14} 
                                color={selectedDate !== null ? "#050505" : "#A1A1AA"} 
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[
                                styles.filterText, 
                                selectedDate !== null && styles.filterTextActive
                            ]}>
                                {getDisplayDate()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <Animated.ScrollView 
                contentContainerStyle={styles.listContent}
                style={{ opacity: fadeAnim, transform: [{ translateY }] }}
                showsVerticalScrollIndicator={false}
            >
                {filteredEvents.map((event) => (
                    <TouchableOpacity 
                        key={event.id} 
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => setSelectedVideoEvent(event)}
                    >
                        <View style={styles.cardIconWrapper}>
                            <View style={[styles.iconBadge, { backgroundColor: `${event.tint}15` }]}>
                                <MaterialCommunityIcons name={event.icon} size={22} color={event.tint} />
                            </View>
                        </View>
                        
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{event.title}</Text>
                                <Text style={styles.cardTime}>{event.time}</Text>
                            </View>
                            <Text style={styles.cardDescription}>{event.description}</Text>
                        </View>

                        <View style={styles.thumbnailContainer}>
                            <ImageBackground 
                                source={event.thumbnail} 
                                style={styles.thumbnailImage}
                                imageStyle={{ borderRadius: 8 }}
                            >
                                <View style={styles.thumbnailOverlay}>
                                    <MaterialCommunityIcons name="play" size={20} color="#FFF" />
                                </View>
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>{event.videoDuration}</Text>
                                </View>
                            </ImageBackground>
                        </View>
                    </TouchableOpacity>
                ))}

                {!filteredEvents.length && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="history" size={48} color="#27272A" />
                        <Text style={styles.emptyTitle}>No activity found</Text>
                        <Text style={styles.emptySubtitle}>There are no events for this selection.</Text>
                        {selectedDate && (
                            <TouchableOpacity style={styles.clearFiltersButton} onPress={() => setSelectedDate(null)}>
                                <Text style={styles.clearFiltersText}>Show All Dates</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </Animated.ScrollView>

            {/* FIXED CALENDAR SPACING */}
            <Modal visible={isCalendarOpen} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarSheet}>
                        
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}>
                                <MaterialCommunityIcons name="chevron-left" size={28} color="#FAFAFA" />
                            </TouchableOpacity>
                            <Text style={styles.calendarTitle}>
                                {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {currentYear}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
                                <MaterialCommunityIcons name="chevron-right" size={28} color="#FAFAFA" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.calWeekdays}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <View key={i} style={styles.calDayWrapper}>
                                    <Text style={styles.calWeekdayText}>{day}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.calendarGrid}>
                            {generateCalendarGrid().map((day, index) => {
                                if (!day) return <View key={`empty-${index}`} style={styles.calDayWrapper} />;
                                
                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isSelected = selectedDate === dateStr;
                                const isToday = today === dateStr;

                                return (
                                    <View key={index} style={styles.calDayWrapper}>
                                        <TouchableOpacity 
                                            style={[styles.calDayBox, isSelected && styles.calDayActive]}
                                            onPress={() => {
                                                setSelectedDate(dateStr);
                                                setIsCalendarOpen(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.calDayText, 
                                                isSelected && styles.calDayTextActive,
                                                isToday && !isSelected && styles.calDayTextToday
                                            ]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>

                        {/* --- NEW TODAY BUTTON --- */}
                        <TouchableOpacity 
                            style={[styles.calendarClearBtn, { backgroundColor: '#3B82F6', marginBottom: 8 }]} 
                            onPress={() => { 
                                const now = new Date();
                                setSelectedDate(today); 
                                setCurrentMonth(now.getMonth());
                                setCurrentYear(now.getFullYear());
                                setIsCalendarOpen(false); 
                            }}
                        >
                            <Text style={styles.calendarClearText}>Go to Today</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.calendarClearBtn} onPress={() => { setSelectedDate(null); setIsCalendarOpen(false); }}>
                            <Text style={styles.calendarClearText}>Clear Filter (Show All)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.calendarCloseBtn} onPress={() => setIsCalendarOpen(false)}>
                            <Text style={styles.calendarCloseText}>Cancel</Text>
                        </TouchableOpacity>
                        
                    </View>
                </View>
            </Modal>

            {/* VIDEO MODAL */}
            <Modal visible={!!selectedVideoEvent} transparent animationType="slide">
                <View style={styles.videoModalOverlay}>
                    <SafeAreaView style={styles.videoModalContainer}>
                        
                        <View style={styles.videoModalHeader}>
                            <View>
                                <Text style={styles.videoModalTitle}>{selectedVideoEvent?.title}</Text>
                                <Text style={styles.videoModalSubtitle}>
                                    {selectedVideoEvent?.date} • {selectedVideoEvent?.time}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.closeVideoBtn} onPress={() => setSelectedVideoEvent(null)}>
                                <MaterialCommunityIcons name="close" size={24} color="#FAFAFA" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.videoPlayerWrapper}>
                            <ImageBackground 
                                source={selectedVideoEvent?.thumbnail} 
                                style={styles.videoPlayerImage}
                                imageStyle={{ opacity: 0.6 }}
                            >
                                <MaterialCommunityIcons name="play-circle" size={80} color="rgba(255,255,255,0.8)" />
                            </ImageBackground>
                            
                            <View style={styles.videoProgressContainer}>
                                <Text style={styles.videoTimeText}>0:00</Text>
                                <View style={styles.videoProgressBarTrack}>
                                    <View style={styles.videoProgressBarFill} />
                                </View>
                                <Text style={styles.videoTimeText}>{selectedVideoEvent?.videoDuration}</Text>
                            </View>
                        </View>

                        <View style={styles.videoActions}>
                            <TouchableOpacity style={styles.videoActionBtn}>
                                <MaterialCommunityIcons name="download-outline" size={24} color="#FAFAFA" />
                                <Text style={styles.videoActionText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.videoActionBtn}>
                                <MaterialCommunityIcons name="share-variant-outline" size={24} color="#FAFAFA" />
                                <Text style={styles.videoActionText}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.videoActionBtnDanger}>
                                <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                                <Text style={styles.videoActionTextDanger}>Delete</Text>
                            </TouchableOpacity>
                        </View>

                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    authContainer: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    
    // --- CRITICAL OVERLAP FIX ---
    dateSelectorContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        position: 'relative',
        zIndex: 9999, // Forces button to top of stack
        elevation: 10, // Forces button to top on Android
    },
    dateSelectorButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#09090B',
        borderWidth: 1,
        borderColor: '#18181B',
        paddingVertical: 16, 
        paddingHorizontal: 20,
        borderRadius: 16,
        width: '100%', 
        minHeight: 56, 
    },
    dateSelectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateSelectorText: {
        color: '#FAFAFA',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    filterContainer: {
        position: 'relative',
        zIndex: 1,
        elevation: 1,
    },
    filterScroll: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        gap: 8,
    },
    filterPill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#09090B',
        borderWidth: 1,
        borderColor: '#18181B',
    },
    filterPillActive: {
        backgroundColor: '#FAFAFA',
        borderColor: '#FAFAFA',
    },
    filterText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#A1A1AA",
    },
    filterTextActive: {
        color: "#050505",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 12,
    },
    card: {
        flexDirection: "row",
        gap: 12,
        borderWidth: 1,
        borderColor: "#18181B",
        borderRadius: 16,
        padding: 12,
        backgroundColor: "#09090B",
        alignItems: 'center',
    },
    cardIconWrapper: {
        justifyContent: "flex-start",
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingRight: 4,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FAFAFA",
    },
    cardDescription: {
        color: "#A1A1AA",
        fontSize: 13,
    },
    cardTime: {
        color: "#71717A",
        fontSize: 12,
        fontWeight: '500',
    },
    thumbnailContainer: {
        width: 76,
        height: 52,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#18181B',
    },
    thumbnailImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },

    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
        borderWidth: 1,
        borderColor: "#18181B",
        borderRadius: 16,
        backgroundColor: "#09090B",
        marginTop: 20,
    },
    emptyTitle: {
        fontWeight: "600",
        color: "#E4E4E7",
        fontSize: 16,
        marginTop: 12,
    },
    emptySubtitle: {
        color: "#71717A",
        fontSize: 14,
        marginTop: 4,
    },
    clearFiltersButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#18181B',
        borderRadius: 8,
    },
    clearFiltersText: {
        color: '#FAFAFA',
        fontSize: 13,
        fontWeight: '600',
    },

    // --- CALENDAR GRID FIXES ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
    },
    calendarSheet: {
        width: '100%',
        maxWidth: 400, 
        backgroundColor: '#111827', 
        borderWidth: 1,
        borderColor: '#1F2937',
        borderRadius: 24, 
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    calendarTitle: {
        color: '#FAFAFA',
        fontSize: 18,
        fontWeight: 'bold',
    },
    calNavBtn: {
        padding: 4,
    },
    calWeekdays: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    // The wrapper ensures exactly 1/7th width per day
    calDayWrapper: {
        width: '14.28%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calWeekdayText: {
        color: '#71717A',
        fontSize: 13,
        fontWeight: '600',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 12, // More vertical breathing room
    },
    calDayBox: {
        width: 38, // Slightly smaller than wrapper to allow spacing
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 19,
    },
    calDayActive: {
        backgroundColor: '#10B981',
    },
    calDayText: {
        color: '#FAFAFA',
        fontSize: 15,
        fontWeight: '500',
    },
    calDayTextToday: {
        color: '#3B82F6',
        fontWeight: 'bold',
    },
    calDayTextActive: {
        color: '#050505',
        fontWeight: 'bold',
    },
    calendarClearBtn: {
        marginTop: 24,
        alignItems: 'center',
        paddingVertical: 14,
        backgroundColor: '#1F2937', 
        borderRadius: 12,
    },
    calendarClearText: {
        color: '#FAFAFA',
        fontSize: 15,
        fontWeight: '600',
    },
    calendarCloseBtn: {
        marginTop: 12,
        alignItems: 'center',
        paddingVertical: 14,
    },
    calendarCloseText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
    },

    videoModalOverlay: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoModalContainer: {
        flex: 1,
    },
    videoModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
    },
    videoModalTitle: {
        color: '#FAFAFA',
        fontSize: 20,
        fontWeight: 'bold',
    },
    videoModalSubtitle: {
        color: '#A1A1AA',
        fontSize: 14,
        marginTop: 4,
    },
    closeVideoBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#18181B',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlayerWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#111827',
        marginTop: 20,
    },
    videoPlayerImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    videoProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#09090B',
    },
    videoTimeText: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '500',
        width: 32,
        textAlign: 'center',
    },
    videoProgressBarTrack: {
        flex: 1,
        height: 4,
        backgroundColor: '#27272A',
        borderRadius: 2,
        marginHorizontal: 12,
    },
    videoProgressBarFill: {
        width: '30%',
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    videoActions: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 40,
    },
    videoActionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    videoActionBtnDanger: {
        alignItems: 'center',
        gap: 8,
    },
    videoActionText: {
        color: '#FAFAFA',
        fontSize: 13,
        fontWeight: '600',
    },
    videoActionTextDanger: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    }
});