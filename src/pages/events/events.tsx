import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { API_BASE_URL } from "../../config";
import { AppContext } from "../../context/app-context";
import { useTheme } from "../../context/theme-context";
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
    lock:          { category: "access",   title: "Door Locked",        icon: "lock",                  tint: "#10B981" },
    unlock:        { category: "access",   title: "Door Unlocked",      icon: "lock-open",             tint: "#10B981" },
    motion:        { category: "motion",   title: "Motion Detected",    icon: "walk",                  tint: "#8B5CF6" },
    doorbell:      { category: "doorbell", title: "Doorbell Rung",      icon: "bell-ring",             tint: "#F59E0B" },
    failed_access: { category: "doorbell", title: "Failed Access",      icon: "shield-alert-outline",  tint: "#EF4444" },
    face:          { category: "access",   title: "Face Unlock",        icon: "face-recognition",      tint: "#10B981" },
    fingerprint:   { category: "access",   title: "Fingerprint Unlock", icon: "fingerprint",           tint: "#10B981" },
    keypad:        { category: "access",   title: "Keypad Unlock",      icon: "dialpad",               tint: "#F59E0B" },
    bluetooth:     { category: "access",   title: "Bluetooth Unlock",   icon: "bluetooth",             tint: "#3B82F6" },
};

const DEFAULT_EVENT = { category: "access" as EventCategory, title: "Event", icon: "bell-outline", tint: "#71717A" };

const filterOptions: { label: string; value: "all" | EventCategory; icon: string; tint: string; desc: string }[] = [
    { label: "All Activity", value: "all",      icon: "view-list-outline",   tint: "#3B82F6", desc: "Everything" },
    { label: "Doorbell",     value: "doorbell", icon: "bell-ring-outline",   tint: "#F59E0B", desc: "Rings & alerts" },
    { label: "Access",       value: "access",   icon: "lock-outline",        tint: "#10B981", desc: "Lock events" },
    { label: "Motion",       value: "motion",   icon: "walk",                tint: "#8B5CF6", desc: "Movement detected" },
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
    const { colors, isDark } = useTheme();

    const [selectedFilter, setSelectedFilter] = useState<"all" | EventCategory>("all");
    const [selectedDate,   setSelectedDate]   = useState<string | null>(today);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentMonth,   setCurrentMonth]   = useState(new Date().getMonth());
    const [currentYear,    setCurrentYear]    = useState(new Date().getFullYear());

    const [events,         setEvents]         = useState<EventItem[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [eventsError,   setEventsError]   = useState<string | null>(null);

    const fadeAnim   = useRef(new Animated.Value(0)).current;
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

    // Count events per category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: events.length, doorbell: 0, access: 0, motion: 0 };
        events.forEach((e) => { if (e.category in counts) counts[e.category]++; });
        return counts;
    }, [events]);

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
                <View style={styles.authContainer}>
                    <SigninForm />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* PAGE TITLE + DATE SELECTOR */}
                <View style={[styles.titleContainer, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>Activity</Text>
                    <TouchableOpacity
                        onPress={() => setIsCalendarOpen(true)}
                        style={[styles.datePill, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                    >
                        <MaterialCommunityIcons name="calendar-month" size={15} color={colors.textSecond} style={{ marginRight: 6 }} />
                        <Text style={[styles.datePillText, { color: colors.textSecond }]}>{getDisplayDate()}</Text>
                        {selectedDate && (
                            <TouchableOpacity onPress={() => setSelectedDate(null)} style={{ marginLeft: 6 }}>
                                <MaterialCommunityIcons name="close-circle" size={15} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>

                {/* VERTICAL FILTER CARDS (2×2 grid) */}
                <View style={styles.filterGrid}>
                    {filterOptions.map((option) => {
                        const isActive = selectedFilter === option.value;
                        const count = categoryCounts[option.value] ?? 0;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setSelectedFilter(option.value)}
                                style={[
                                    styles.filterCard,
                                    { backgroundColor: isActive ? `${option.tint}18` : colors.bgCard,
                                      borderColor: isActive ? option.tint : colors.border },
                                ]}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.filterCardIcon, { backgroundColor: `${option.tint}20` }]}>
                                    <MaterialCommunityIcons name={option.icon as any} size={22} color={option.tint} />
                                </View>
                                <Text style={[styles.filterCardLabel, { color: isActive ? option.tint : colors.text }]}>
                                    {option.label}
                                </Text>
                                <Text style={[styles.filterCardDesc, { color: colors.textTertiary }]}>{option.desc}</Text>
                                <View style={[styles.filterCardBadge, { backgroundColor: `${option.tint}20` }]}>
                                    <Text style={[styles.filterCardBadgeText, { color: option.tint }]}>
                                        {loadingEvents ? "…" : count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* SECTION HEADER */}
                <View style={styles.listHeader}>
                    <Text style={[styles.listHeaderText, { color: colors.textTertiary }]}>
                        {filterOptions.find(f => f.value === selectedFilter)?.label ?? "Events"}
                    </Text>
                    {filteredEvents.length > 0 && (
                        <Text style={[styles.listHeaderCount, { color: colors.textMuted }]}>
                            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                        </Text>
                    )}
                </View>

                {/* EVENT LIST */}
                <Animated.View
                    style={[styles.listContent, { opacity: fadeAnim, transform: [{ translateY }] }]}
                >
                    {loadingEvents && (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="large" color={colors.text} />
                            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading events…</Text>
                        </View>
                    )}

                    {eventsError && !loadingEvents && (
                        <View style={[styles.errorState, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                            <MaterialCommunityIcons name="wifi-off" size={40} color={colors.border} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>Could not load events</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>{eventsError}</Text>
                            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.bgSubtle }]} onPress={fetchEvents}>
                                <Text style={[styles.retryText, { color: colors.text }]}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!loadingEvents && !eventsError && filteredEvents.map((event) => (
                        <View key={event.id} style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                            <View style={styles.cardIconWrapper}>
                                <View style={[styles.iconBadge, { backgroundColor: `${event.tint}18` }]}>
                                    <MaterialCommunityIcons name={event.icon} size={22} color={event.tint} />
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.cardTitle, { color: colors.text }]}>{event.title}</Text>
                                    <Text style={[styles.cardTime, { color: colors.textTertiary }]}>{event.time}</Text>
                                </View>
                                <Text style={[styles.cardDescription, { color: colors.textSecond }]} numberOfLines={1}>{event.description}</Text>
                            </View>
                        </View>
                    ))}

                    {!loadingEvents && !eventsError && filteredEvents.length === 0 && (
                        <View style={[styles.emptyState, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                            <MaterialCommunityIcons name="history" size={48} color={colors.border} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No activity found</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>There are no events for this selection.</Text>
                            {selectedDate && (
                                <TouchableOpacity style={[styles.clearFiltersButton, { backgroundColor: colors.bgSubtle }]} onPress={() => setSelectedDate(null)}>
                                    <Text style={[styles.clearFiltersText, { color: colors.text }]}>Show All Dates</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

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
    },
    authContainer: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: "700",
    },
    datePill: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    datePillText: {
        fontSize: 13,
        fontWeight: "600",
    },
    // Vertical filter card grid
    filterGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 4,
        gap: 10,
    },
    filterCard: {
        width: "47%",
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        gap: 6,
    },
    filterCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    filterCardLabel: {
        fontSize: 14,
        fontWeight: "700",
    },
    filterCardDesc: {
        fontSize: 12,
    },
    filterCardBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 4,
    },
    filterCardBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    listHeaderText: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    listHeaderCount: {
        fontSize: 12,
        fontWeight: "600",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 10,
    },
    loadingState: {
        alignItems: "center",
        paddingVertical: 60,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
    },
    errorState: {
        alignItems: "center",
        paddingVertical: 48,
        borderWidth: 1,
        borderRadius: 16,
        marginTop: 20,
        gap: 8,
    },
    retryButton: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    retryText: {
        fontWeight: "600",
        fontSize: 14,
    },
    card: {
        flexDirection: "row",
        gap: 12,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
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
    },
    cardDescription: {
        fontSize: 13,
    },
    cardTime: {
        fontSize: 12,
        fontWeight: "500",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
        borderWidth: 1,
        borderRadius: 16,
        marginTop: 20,
    },
    emptyTitle: {
        fontWeight: "600",
        fontSize: 16,
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    clearFiltersButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    clearFiltersText: {
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
    calendarCloseText: {
        color: "#9CA3AF",
        fontSize: 15,
        fontWeight: "600",
    },
});