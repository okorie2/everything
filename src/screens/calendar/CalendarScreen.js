import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-big-calendar";
import { db, auth } from "../../../backend/firebase";
import { useCalendarData } from "../../hooks/useCalendarData";
import moment from "moment";

// Date formatting utility

const formatDate = (date) => {
  try {
    return moment(date).format("dddd, MMMM D"); // e.g. "Friday, May 16"
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return String(date);
  }
};

// Time formatting utility
const formatTime = (date) => {
  try {
    return moment(date).format("hh:mm A"); // e.g. "11:00 PM"
  } catch (error) {
    console.error("Error formatting time:", date, error);
    return String(date); // Fallback
  }
};

export default function CalendarScreen({ navigation }) {
  const uid = auth.currentUser.uid;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("month"); // 'day', 'week', 'month'

  const { events, isLoading, error, loadData, refresh } = useCalendarData(
    db,
    uid
  );

  // On mount
  useEffect(() => {
    console.log("CalendarScreen mounted");
    loadData();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Navigate dates
  const navigatePrevious = () => {
    const d = new Date(selectedDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };
  const navigateNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };
  const goToToday = () => setSelectedDate(new Date());

  const handleEventPress = (event) => {
    const isOwner = event.clinicianId === uid;

    console.log("Event pressed:", event);

    try {
      if (event.type === "appointment") {
        const reasonText =
          event.reason ||
          event.description ||
          event.fullData?.reason ||
          event.fullData?.description ||
          "No details provided";
        const message = [
          `Date: ${formatDate(event.start)}`,
          `Time: ${formatTime(event.start)} – ${formatTime(event.end)}`,
          `Place: ${event.businessName}`,
          `Reason: ${reasonText}`,
        ].join("\n");
        Alert.alert(
          isOwner ? "Client Appointment" : "My Appointment",
          message,
          [
            { text: "Close", style: "cancel" },
            ...(isOwner
              ? [
                  {
                    text: "Cancel Appointment",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteDoc(doc(db, event.docPath));
                        Alert.alert(
                          "Cancelled",
                          "Appointment has been cancelled."
                        );
                        loadData();
                      } catch (e) {
                        Alert.alert("Error", "Failed to cancel appointment.");
                      }
                    },
                  },
                ]
              : []),
          ]
        );
      } else {
        // For non-appointment events (slots)
        Alert.alert(
          isOwner ? "Clinic Slot" : "My Slot",
          `Date: ${formatDate(event.start)}\nTime: ${formatTime(
            event.start
          )} – ${formatTime(event.end)}\nClinic: ${event.clinicName}`,
          [{ text: "Close", style: "cancel" }]
        );
      }
    } catch (error) {
      console.error("Error handling event press:", error);
      Alert.alert("Error", "An error occurred while processing the event.");
    }
  };
  const renderEventCell = (evt) => (
    <TouchableOpacity
      style={[styles.eventCell, { backgroundColor: evt.color }]}
      onPress={() => handleEventPress(evt)}
    >
      <Text style={styles.eventTitle} numberOfLines={1}>
        {evt.title}
      </Text>
      <Text style={styles.eventTime}>{formatTime(evt.start)}</Text>
      <Text style={styles.eventClinic} numberOfLines={1}>
        {evt.businessName}
      </Text>
    </TouchableOpacity>
  );

  // Loading
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your schedule…</Text>
      </View>
    );
  }

  // Error
  if (error && !events.length) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to load calendar</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={styles.dateControls}>
          <TouchableOpacity onPress={navigatePrevious} style={styles.navButton}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateNext} style={styles.navButton}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subheader */}
      <View style={styles.subHeader}>
        <Text style={styles.currentDate}>{formatDate(selectedDate)}</Text>
        <View style={styles.viewModeContainer}>
          {["day", "week", "month"].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.activeViewMode,
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === mode && styles.activeViewModeText,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#16A34A" }]} />
          <Text style={styles.legendText}>My Appointments</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#2563EB" }]} />
          <Text style={styles.legendText}>Booked Slots</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#93C5FD" }]} />
          <Text style={styles.legendText}>Open Slots</Text>
        </View>
      </View>

      {/* Calendar */}
      <ScrollView
        style={styles.calendarContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Calendar
          events={events}
          date={selectedDate}
          mode={viewMode}
          height={600}
          showTime
          renderEvent={renderEventCell}
          onPressEvent={handleEventPress}
          onSwipeHorizontal={(dir) => {
            if (dir === "LEFT") navigateNext();
            if (dir === "RIGHT") navigatePrevious();
          }}
          weekStartsOn={1}
          swipeEnabled
        />

        {/* No events */}
        {events.length === 0 && (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsIcon}>📅</Text>
            <Text style={styles.noEventsText}>
              No appointments scheduled for this day
            </Text>
            <TouchableOpacity style={styles.scheduleButton}>
              <Text style={styles.scheduleButtonText}>
                Schedule Appointment
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#64748B" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: "600", color: "#EF4444" },
  errorMessage: { fontSize: 16, color: "#64748B", textAlign: "center" },
  retryButton: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1E293B" },
  dateControls: { flexDirection: "row", alignItems: "center" },
  navButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navButtonText: { fontSize: 16, color: "#2563EB", fontWeight: "600" },
  todayButton: {
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },
  todayButtonText: { fontSize: 14, color: "#2563EB", fontWeight: "600" },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  currentDate: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  viewModeContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeViewMode: {
    backgroundColor: "#fff",
    elevation: 1,
  },
  viewModeText: { fontSize: 14, color: "#64748B" },
  activeViewModeText: { color: "#1E293B", fontWeight: "600" },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: { fontSize: 12, color: "#64748B" },
  calendarContainer: { flex: 1 },
  eventCell: { borderRadius: 4, padding: 4, justifyContent: "space-between" },
  eventTitle: { color: "#fff", fontWeight: "600", fontSize: 12 },
  eventTime: { color: "#fff", fontSize: 10, opacity: 0.9 },
  eventClinic: {
    color: "#fff",
    fontSize: 10,
    opacity: 0.9,
    fontStyle: "italic",
  },
  noEventsContainer: { alignItems: "center", padding: 24, marginTop: 40 },
  noEventsIcon: { fontSize: 48, marginBottom: 16, opacity: 0.6 },
  noEventsText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 16,
    textAlign: "center",
  },
  scheduleButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
  },
  scheduleButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
