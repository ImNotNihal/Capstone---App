import React, { useContext } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AppContext, RequestLogEntry } from "../../context/app-context";
import styles from "./styles";

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
    GET:    { bg: "#dbeafe", text: "#1d4ed8" },
    POST:   { bg: "#d1fae5", text: "#065f46" },
    PUT:    { bg: "#fef3c7", text: "#92400e" },
    PATCH:  { bg: "#ede9fe", text: "#5b21b6" },
    DELETE: { bg: "#fee2e2", text: "#991b1b" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pass:    { bg: "#d1fae5", text: "#065f46" },
    fail:    { bg: "#fee2e2", text: "#991b1b" },
    pending: { bg: "#f3f4f6", text: "#6b7280" },
};

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function truncate(value: any, maxLen = 300): string {
    const str = JSON.stringify(value, null, 2);
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + "\n…";
}

function LogCard({ entry }: { entry: RequestLogEntry }) {
    const methodColors = METHOD_COLORS[entry.method] ?? { bg: "#f3f4f6", text: "#374151" };
    const statusColors = STATUS_COLORS[entry.status];

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={[styles.methodBadge, { backgroundColor: methodColors.bg }]}>
                    <Text style={[styles.methodText, { color: methodColors.text }]}>{entry.method}</Text>
                </View>
                <Text style={styles.path} numberOfLines={1}>{entry.path || entry.url}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {entry.status === "pending" ? "…" : entry.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.metaText}>{formatTime(entry.timestamp)}</Text>
                {entry.statusCode !== undefined && (
                    <Text style={styles.metaText}>HTTP {entry.statusCode}</Text>
                )}
                {entry.durationMs !== undefined && (
                    <Text style={styles.metaText}>{entry.durationMs}ms</Text>
                )}
            </View>

            {entry.errorMessage && (
                <Text style={styles.errorText}>{entry.errorMessage}</Text>
            )}

            {entry.responseData !== null && entry.responseData !== undefined && (
                <View style={styles.responseBox}>
                    <Text style={styles.responseText}>{truncate(entry.responseData)}</Text>
                </View>
            )}
        </View>
    );
}

export default function Logs() {
    const { requestLogs, clearLogs } = useContext(AppContext);

    return (
        <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <Text style={styles.title}>Request Logs</Text>
                    <View style={styles.devBadge}>
                        <Text style={styles.devBadgeText}>DEV MODE</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
            </View>

            {requestLogs.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No requests yet</Text>
                    <Text style={styles.emptySubtitle}>HTTP calls will appear here as you use the app.</Text>
                </View>
            ) : (
                requestLogs.map(entry => <LogCard key={entry.id} entry={entry} />)
            )}
        </ScrollView>
    );
}
