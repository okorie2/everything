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
  Modal,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-big-calendar";
import { db, auth } from "../../../backend/firebase";
import { useCalendarData } from "../../hooks/useCalendarData";
import moment from "moment";
import { deleteDoc, doc } from "firebase/firestore";

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
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showAllEventsModal, setShowAllEventsModal] = useState(false);

  const {
    events: rawEvents,
    isLoading,
    error,
    loadData,
    refresh,
  } = useCalendarData(db, uid);

  // Ensure events have proper Date objects for start and end
  const events = useMemo(() => {
    return rawEvents.map((event) => ({
      ...event,
      // Ensure start and end are proper Date objects
      start: event.start instanceof Date ? event.start : new Date(event.start),
      end: event.end instanceof Date ? event.end : new Date(event.end),
    }));
  }, [rawEvents]);

  // Debug events
  useEffect(() => {
    if (events.length > 0) {
      console.log("First event:", {
        title: events[0].title,
        start: events[0].start.toString(),
        end: events[0].end.toString(),
        isDate: events[0].start instanceof Date,
      });
    }
  }, [events]);

  // On mount
  useEffect(() => {
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

  // Handle cell press to show all events for a day
  const handleCellPress = (date) => {
    // Find all events for this day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEvents = events.filter((event) => {
      const eventStart = new Date(event.start);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });

    if (dayEvents.length > 0) {
      setSelectedDayEvents(dayEvents);
      setShowAllEventsModal(true);
    }
  };

  // Custom event renderer for all view modes
  const renderEventCell = (evt) => (
    <TouchableOpacity
      style={[
        styles.eventCell,
        { backgroundColor: evt.color },
        // Add specific styles for day/week view to ensure visibility
        (viewMode === "day" || viewMode === "week") && styles.dayWeekEventCell,
      ]}
      onPress={() => handleEventPress(evt)}
    >
      <Text style={styles.eventTitle} numberOfLines={1}>
        {evt.title}
      </Text>
      <Text style={styles.eventTime}>{formatTime(evt.start)}</Text>
      {/* Only show clinic name if there's enough space */}
      {(viewMode === "month" || evt.end - evt.start > 3600000) && (
        <Text style={styles.eventClinic} numberOfLines={1}>
          {evt.businessName}
        </Text>
      )}
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
          renderEvent={viewMode === "month" ? renderEventCell : undefined}
          onPressEvent={handleEventPress}
          onPressCell={handleCellPress}
          onSwipeHorizontal={(dir) => {
            if (dir === "LEFT") navigateNext();
            if (dir === "RIGHT") navigatePrevious();
          }}
          weekStartsOn={1}
          swipeEnabled
          // Fix for issue #1: Make events visible in all views
          eventCellStyle={(event) => ({
            backgroundColor: event.color,
            borderRadius: 4,
            padding: 4,
            opacity: 1, // Ensure full opacity
            minHeight: 25, // Minimum height to ensure visibility
          })}
          // Fix for issue #2: Allow more events to be visible
          maxVisibleEventCount={3} // Show more events before "more" indicator
          // Enable scrolling in month view for days with many events
          scrollOffsetMinutes={0}
          // Add this to ensure events are properly displayed
          overlapOffset={10}
          // Make sure events are visible in day/week view
          dayHeaderHighlightColor="#EFF6FF"
          eventMinHeightForMonthView={25} // Increased minimum height for month view events
          // Increase cell height in month view
          calendarCellStyle={{
            minHeight: viewMode === "month" ? 80 : undefined,
          }}
          // Ensure proper date handling
          hourFormat="h A"
          // Increase the height of the month view
          monthViewStyle={{
            minHeight: 650,
          }}
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

      {/* Modal to show all events for a day */}
      <Modal
        visible={showAllEventsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllEventsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                All Events ({selectedDayEvents.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowAllEventsModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedDayEvents}
              keyExtractor={(item, index) => `event-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalEventItem,
                    { borderLeftColor: item.color },
                  ]}
                  onPress={() => {
                    setShowAllEventsModal(false);
                    handleEventPress(item);
                  }}
                >
                  <Text style={styles.modalEventTime}>
                    {formatTime(item.start)} - {formatTime(item.end)}
                  </Text>
                  <Text style={styles.modalEventTitle}>{item.title}</Text>
                  <Text style={styles.modalEventLocation}>
                    {item.businessName || item.clinicName || ""}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalEventList}
            />
          </View>
        </View>
      </Modal>
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
  eventCell: {
    borderRadius: 4,
    padding: 4,
    justifyContent: "space-between",
    minHeight: 25, // Ensure minimum height for visibility
    marginBottom: 2, // Add space between events
  },
  // New style for day/week view events
  dayWeekEventCell: {
    minHeight: 30,
    marginVertical: 2,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.5)",
  },
  eventTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    // Make sure text is visible
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#64748B",
  },
  modalEventList: {
    padding: 16,
  },
  modalEventItem: {
    padding: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
  },
  modalEventTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  modalEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  modalEventLocation: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
  },
});
