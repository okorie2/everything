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
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../../backend/firebase";
import { HOSPITAL_ID } from "../../constants/hospital";

// Date formatting utility
const formatDate = (date) => {
  const options = { weekday: "long", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

// Time formatting utility
const formatTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export default function CalendarScreen({ navigation }) {
  const [events, setEvents] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("month"); // 'day', 'week', 'month'

  const uid = auth.currentUser.uid;

  // Memoize the start of today to avoid re-creating
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Main data-loading routine
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1) Fetch all clinics and build a map of clinicId → clinicName
      const clinicSnap = await getDocs(
        collection(db, "businesses", HOSPITAL_ID, "clinics")
      );
      const clinicNames = {};
      const clinicIds = clinicSnap.docs.map((d) => {
        clinicNames[d.id] = d.data().title ?? d.id;
        return d.id;
      });

      // 2) Define the 7-day window
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      // 3) Gather events
      const allEvents = [];
      for (const clinicId of clinicIds) {
        const slotsRef = collection(
          db,
          "businesses",
          HOSPITAL_ID,
          "clinics",
          clinicId,
          "slots"
        );
        const q = query(
          slotsRef,
          where("start", ">=", today),
          where("start", "<", endDate)
        );
        const snap = await getDocs(q);

        snap.docs.forEach((docSnap) => {
          const s = docSnap.data();
          const status = s.status ?? "open";
          const isDoc = s.clinician_id === uid;
          const isPat = (s.booked ?? []).includes(uid);

          // Doctors see all slots; patients only their own bookings
          if (!isDoc && !isPat) return;

          allEvents.push({
            id: docSnap.id,
            title: isDoc
              ? isPat
                ? "My own appointment"
                : `Patient slot (${status === "booked" ? "Booked" : "Open"})`
              : "My appointment",
            start: s.start.toDate(),
            end: s.end.toDate(),
            color: isDoc
              ? status === "booked"
                ? "#2563EB"
                : "#93C5FD"
              : "#16A34A",
            slotPath: docSnap.ref.path,
            clinicName: clinicNames[clinicId],
            status,
            patientCount: (s.booked ?? []).length,
            clinicianId: s.clinician_id,
          });
        });
      }

      setEvents(allEvents);
    } catch (err) {
      console.error("Calendar load failed:", err);
      setError(err.message ?? "Unknown error");
      setEvents([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

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

  // Event press
  const handleEventPress = (event) => {
    if (event.clinicianId === uid) {
      Alert.alert(
        event.status === "booked" ? "Booked Appointment" : "Open Slot",
        `Clinic: ${event.clinicName}\nTime: ${formatTime(
          event.start
        )} – ${formatTime(event.end)}\nPatients: ${event.patientCount}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "View Details",
            onPress: () =>
              navigation.navigate("QueueDetail", { slotPath: event.slotPath }),
          },
        ]
      );
    } else {
      Alert.alert(
        "My Appointment",
        `Clinic: ${event.clinicName}\nTime: ${formatTime(
          event.start
        )} – ${formatTime(event.end)}`,
        [
          { text: "Close", style: "cancel" },
          //   {
          //     text: "View Details",
          //     onPress: () =>
          //       navigation.navigate("AppointmentDetail", {
          //         slotPath: event.slotPath,
          //         appointmentTime: event.start.toISOString(),
          //         clinicName: event.clinicName,
          //       }),
          //   },
        ]
      );
    }
  };

  // Custom cell
  const renderEventCell = (evt) => (
    <TouchableOpacity
      style={[styles.eventCell, { backgroundColor: evt.color }]}
      onPress={() => handleEventPress(evt)} // Trigger event press when clicked
    >
      <Text style={styles.eventTitle} numberOfLines={1}>
        {evt.title}
      </Text>
      <Text style={styles.eventTime}>{formatTime(evt.start)}</Text>
      <Text style={styles.eventClinic} numberOfLines={1}>
        {evt.clinicName}
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
