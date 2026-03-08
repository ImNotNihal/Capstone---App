import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
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
import { API_BASE_URL } from "../../config";
import SigninForm from "../settings/signInForm";

type EventCategory = "doorbell" | "access" | "motion";

type EventItem = {
    id: string;
    category: EventCategory;
    title: string;
    description: string;
    date: string;   // YYYY-MM-DD
    time: string;   // HH:MM AM/PM
    icon: any;
    tint: string;
};

const EVENT_MAP: Record<string, { category: EventCategory; title: string; icon: string; tint: string }> = {
    lock:           { category: "access",   title: "Door Locked",         icon: "lock",                  tint: "#10B981" },
    unlock:         { category: "access",   title: "Door Unlocked",       icon: "lock-open",             tint: "#10B981" },
    motion:         { category: "motion",   title: "Motion Detected",     icon: "walk",                  tint: "#8B5CF6" },
    doorbell:       { category: "doorbell", title: "Doorbell Rung",       icon: "bell-ring",             tint: "#F59E0B" },
    failed_access:  { category: "doorbell", title: "Failed Access",       icon: "shield-alert-outline",  tint: "#EF4444" },
    face:           { category: "access",   title: "Face Unlock",         icon: "face-recognition",      tint: "#10B981" },
    fingerprint:    { category: "access",   title: "Fingerprint Unlock",  icon: "fingerprint",           tint: "#10B981" },
    keypad:         { category: "access",   title: "Keypad Unlock",       icon: "dialpad",               tint: "#F59E0B" },
    bluetooth:      { category: "access",   title: "Bluetooth Unlock",    icon: "bluetooth",             tint: "#3B82F6" },
};

const DEFAULT_EVENT = { category: "access" as EventCategory, title: "Event", icon: "bell-outline", tint: "#71717A" };

const filterOptions: { label: string; value: "all" | EventCategory }[] = [
    { label: "All Activity", value: "all" },
    { label: "Doorbell",     value: "doorbell" },
    { label: "Access",       value: "access" },
    { label: "Motion",       value: "motion" },
];

const today     = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

function formatTime(iso: string): string {
    const d = new Date(iso);
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(iso: string): string {
    return iso.split("T")[0];
}

const getDaysInMonth   = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export default function Events() {
    const { user, authToken, deviceId } = useContext(AppContext);

    const [selectedFilter, setSelectedFilter] = useState<"all" | EventCategory>("all");
    const [selectedDate,   setSelectedDate]   = useState<string | null>(today);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentMonth,   setCurrentMonth]   = useState(new Date().getMonth());
    const [currentYear,    setCurrentYear]    = useState(new Date().getFullYear());

    const [events,        setEvents]        = useState<EventItem[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [eventsError,   setEventsError]   = useState<string | null>(null);

    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (user) {
            Animated.parallel([
                Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
        }
    }, [user, fadeAnim, translateY]);

    const fetchEvents = useCallback(async () => {
        if (!authToken || !deviceId) return;
        setLoadingEvents(true);
        setEventsError(null);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${API_BASE_URL}devices/${deviceId}/events?limit=100`, {
                headers: { Authorization: `Bearer ${authToken}` },
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error("Failed to load events");
            const data: any[] = await res.json();
            setEvents(
                data.map((e) => {
                    const mapping = EVENT_MAP[e.type] ?? DEFAULT_EVENT;
                    return {
                        id:          e.id,
                        category:    mapping.category,
                        title:       mapping.title,
                        description: e.metadata?.description ?? e.metadata?.method ?? mapping.title,
                        date:        formatDate(e.timestamp),
                        time:        formatTime(e.timestamp),
                        icon:        mapping.icon,
                        tint:        mapping.tint,
                    };
                })
            );
        } catch (e: any) {
            setEventsError(e.name === "AbortError" ? "Server unreachable" : (e.message || "Failed to load events"));
        } finally {
            setLoadingEvents(false);
        }
    }, [authToken, deviceId]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const filteredEvents = useMemo(() => {
        return events.filter((evt) => {
            const matchesFilter = selectedFilter === "all" || evt.category === selectedFilter;
            const matchesDate   = selectedDate ? evt.date === selectedDate : true;
            return matchesFilter && matchesDate;
        });
    }, [events, selectedFilter, selectedDate]);

    const getDisplayDate = () => {
        if (!selectedDate) return "All Dates";
        if (selectedDate === today)     return "Today";
        if (selectedDate === yesterday) return "Yesterday";
        return selectedDate;
    };

    const generateCalendarGrid = () => {
        const days     = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const grid: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let i = 1; i <= days; i++)    grid.push(i);
        return grid;
    };

    const changeMonth = (offset: number) => {
        let newMonth = currentMonth + offset;
        let newYear  = currentYear;
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

            {/* PAGE TITLE */}
            <View style={styles.titleContainer}>
                <Text style={styles.pageTitle}>Activity</Text>
            </View>

            {/* FILTER PILLS */}
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

                    {/* DATE PILL */}
                    <TouchableOpacity
                        onPress={() => setIsCalendarOpen(true)}
                        style={[styles.filterPill, selectedDate !== null && styles.filterPillActive]}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <MaterialCommunityIcons
                                name="calendar-month"
                                size={14}
                                color={selectedDate !== null ? "#050505" : "#A1A1AA"}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.filterText, selectedDate !== null && styles.filterTextActive]}>
                                {getDisplayDate()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* EVENT LIST */}
            <Animated.ScrollView
                contentContainerStyle={styles.listContent}
                style={{ opacity: fadeAnim, transform: [{ translateY }], zIndex: 1 }}
                style={{ opacity: fadeAnim, transform: [{ translateY }] }}
                showsVerticalScrollIndicator={false}
            >
                {loadingEvents && (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color="#FAFAFA" />
                        <Text style={styles.loadingText}>Loading events…</Text>
                    </View>
                )}

                {eventsError && !loadingEvents && (
                    <View style={styles.errorState}>
                        <MaterialCommunityIcons name="wifi-off" size={40} color="#27272A" />
                        <Text style={styles.emptyTitle}>Could not load events</Text>
                        <Text style={styles.emptySubtitle}>{eventsError}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!loadingEvents && !eventsError && filteredEvents.map((event) => (
                    <View key={event.id} style={styles.card}>
                        <View style={styles.cardIconWrapper}>
                            <View style={[styles.iconBadge, { backgroundColor: `${event.tint}18` }]}>
                                <MaterialCommunityIcons name={event.icon} size={22} color={event.tint} />
                            </View>
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{event.title}</Text>
                                <Text style={styles.cardTime}>{event.time}</Text>
                            </View>
                            <Text style={styles.cardDescription} numberOfLines={1}>{event.description}</Text>
                        </View>
                    </View>
                ))}

                {!loadingEvents && !eventsError && filteredEvents.length === 0 && (
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

            {/* CALENDAR MODAL */}
            <Modal visible={isCalendarOpen} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarSheet}>

                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}>
                                <MaterialCommunityIcons name="chevron-left" size={28} color="#FAFAFA" />
                            </TouchableOpacity>
                            <Text style={styles.calendarTitle}>
                                {new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} {currentYear}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
                                <MaterialCommunityIcons name="chevron-right" size={28} color="#FAFAFA" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.calWeekdays}>
                            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                <View key={i} style={styles.calDayWrapper}>
                                    <Text style={styles.calWeekdayText}>{day}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.calendarGrid}>
                            {generateCalendarGrid().map((day, index) => {
                                if (!day) return <View key={`empty-${index}`} style={styles.calDayWrapper} />;
                                const dateStr  = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const isSelected = selectedDate === dateStr;
                                const isToday    = today === dateStr;
                                return (
                                    <View key={index} style={styles.calDayWrapper}>
                                        <TouchableOpacity
                                            style={[styles.calDayBox, isSelected && styles.calDayActive]}
                                            onPress={() => { setSelectedDate(dateStr); setIsCalendarOpen(false); }}
                                        >
                                            <Text style={[
                                                styles.calDayText,
                                                isSelected && styles.calDayTextActive,
                                                isToday && !isSelected && styles.calDayTextToday,
                                            ]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[styles.calendarClearBtn, { backgroundColor: "#3B82F6", marginBottom: 8 }]}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#050505",
    },
    authContainer: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 4,
    },
    pageTitle: {
        color: "#FAFAFA",
        fontSize: 28,
        fontWeight: "700",
    },
    filterContainer: {
        zIndex: 10,
        elevation: 10,
    },
    filterScroll: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        gap: 8,
    },
    filterContainer: {
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
        backgroundColor: "#09090B",
        borderWidth: 1,
        borderColor: "#18181B",
    },
    filterPillActive: {
        backgroundColor: "#FAFAFA",
        borderColor: "#FAFAFA",
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
    loadingState: {
        alignItems: "center",
        paddingVertical: 60,
        gap: 12,
    },
    loadingText: {
        color: "#71717A",
        fontSize: 14,
    },
    errorState: {
        alignItems: "center",
        paddingVertical: 48,
        borderWidth: 1,
        borderColor: "#18181B",
        borderRadius: 16,
        backgroundColor: "#09090B",
        marginTop: 20,
        gap: 8,
    },
    retryButton: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: "#18181B",
        borderRadius: 10,
    },
    retryText: {
        color: "#FAFAFA",
        fontWeight: "600",
        fontSize: 14,
    },
    card: {
        flexDirection: "row",
        gap: 12,
        borderWidth: 1,
        borderColor: "#18181B",
        borderRadius: 16,
        padding: 14,
        backgroundColor: "#09090B",
        alignItems: "center",
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
        fontWeight: "500",
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
        backgroundColor: "#18181B",
        borderRadius: 8,
    },
    clearFiltersText: {
        color: "#FAFAFA",
        fontSize: 13,
        fontWeight: "600",
    },
    // Calendar
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    calendarSheet: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1F2937",
        borderRadius: 24,
        padding: 24,
    },
    calendarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    calendarTitle: {
        color: "#FAFAFA",
        fontSize: 18,
        fontWeight: "bold",
    },
    calNavBtn: {
        padding: 4,
    },
    calWeekdays: {
        flexDirection: "row",
        marginBottom: 12,
    },
    calDayWrapper: {
        width: "14.28%",
        alignItems: "center",
        justifyContent: "center",
    },
    calWeekdayText: {
        color: "#71717A",
        fontSize: 13,
        fontWeight: "600",
    },
    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 12,
    },
    calDayBox: {
        width: 38,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 19,
    },
    calDayActive: {
        backgroundColor: "#10B981",
    },
    calDayText: {
        color: "#FAFAFA",
        fontSize: 15,
        fontWeight: "500",
    },
    calDayTextToday: {
        color: "#3B82F6",
        fontWeight: "bold",
    },
    calDayTextActive: {
        color: "#050505",
        fontWeight: "bold",
    },
    calendarClearBtn: {
        marginTop: 24,
        alignItems: "center",
        paddingVertical: 14,
        backgroundColor: "#1F2937",
        borderRadius: 12,
    },
    calendarClearText: {
        color: "#FAFAFA",
        fontSize: 15,
        fontWeight: "600",
    },
    calendarCloseBtn: {
        marginTop: 12,
        alignItems: "center",
        paddingVertical: 14,
    },
    },
    calendarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    calendarTitle: {
        color: "#FAFAFA",
        fontSize: 18,
        fontWeight: "bold",
    },
    calNavBtn: {
        padding: 4,
    },
    calWeekdays: {
        flexDirection: "row",
        marginBottom: 12,
    },
    calDayWrapper: {
        width: "14.28%",
        alignItems: "center",
        justifyContent: "center",
    },
    calWeekdayText: {
        color: "#71717A",
        fontSize: 13,
        fontWeight: "600",
    },
    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 12,
    },
    calDayBox: {
        width: 38,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 19,
    },
    calDayActive: {
        backgroundColor: "#10B981",
    },
    calDayText: {
        color: "#FAFAFA",
        fontSize: 15,
        fontWeight: "500",
    },
    calDayTextToday: {
        color: "#3B82F6",
        fontWeight: "bold",
    },
    calDayTextActive: {
        color: "#050505",
        fontWeight: "bold",
    },
    calendarClearBtn: {
        marginTop: 24,
        alignItems: "center",
        paddingVertical: 14,
        backgroundColor: "#1F2937",
        borderRadius: 12,
    },
    calendarClearText: {
        color: "#FAFAFA",
        fontSize: 15,
        fontWeight: "600",
    },
    calendarCloseBtn: {
        marginTop: 12,
        alignItems: "center",
        paddingVertical: 14,
    },
    calendarCloseText: {
        color: "#9CA3AF",
        fontSize: 15,
        fontWeight: "600",
    },
});
