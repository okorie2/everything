import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Platform,
  ToastAndroid,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  doc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../../../backend/firebase";
import {
  startOfDay,
  endOfDay,
  addDays,
  format,
  isToday,
  isTomorrow,
  differenceInMinutes,
} from "date-fns";
import { HOSPITAL_ID } from "../../constants/hospital";

const fadeAnim = new Animated.Value(0);

export default function SlotListScreen({ route, navigation }) {
  const { clinicId, clinicTitle, clinicImage } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [filterOption, setFilterOption] = useState("all"); // all|morning|afternoon|evening
  const [appointments, setAppointments] = useState([]);

  const userId = auth.currentUser?.uid;

  // Next 14 days for date-picker
  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
    []
  );

  // Header label
  const formatDateHeader = useCallback((d) => {
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
  }, []);

  // Real-time listener for slots on selectedDate
  const setupRealtimeListener = useCallback(() => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const q = query(
      collection(db, "appointments"),
      where("businessId", "==", HOSPITAL_ID),
      where("start", ">=", Timestamp.fromDate(start)),
      where("end", "<=", Timestamp.fromDate(end))
    );

    return onSnapshot(
      q,
      (snap) => {
        setError(null);
        const arr = snap.docs.map((d) => ({
          id: d.id,
          ref: d.ref,
          ...d.data(),
        }));
        setAppointments(arr);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Realtime slots error:", err);
        setError("Could not load slots in real time.");
        setLoading(false);
        setRefreshing(false);
      }
    );
  }, [clinicId, selectedDate]);

  // Hook into that listener
  useEffect(() => {
    setLoading(true);
    const unsubscribe = setupRealtimeListener();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return unsubscribe;
  }, [setupRealtimeListener]);

  const onRefresh = () => {
    setRefreshing(true);
    // real-time will update
    setTimeout(() => setRefreshing(false), 500);
  };

  const slots = useMemo(() => {
    const slotStartHr = 9; // 9 AM
    const slotEndHr = 17; // 5 PM
    const slotDurationHr = 1; // 1 hour
    const maxCapacityPerSlot = 20; // Maximum appointments per slot

    // Create array to hold all slots
    const timeSlots = [];

    if (!selectedDate) return timeSlots;

    // Clone the selected date to avoid modifying the original
    const currentDate = new Date(selectedDate);

    // Set the date to start at the first slot time
    currentDate.setHours(slotStartHr, 0, 0, 0);

    // Generate slots from start hour to end hour
    for (let hour = slotStartHr; hour < slotEndHr; hour++) {
      // Create slot start time
      const slotStart = new Date(currentDate);

      // Create slot end time (1 hour later)
      const slotEnd = new Date(currentDate);
      slotEnd.setHours(hour + slotDurationHr);
      console.log(appointments, "appointments");

      // Count appointments that fall within this time slot
      const appointmentsInSlot = appointments.filter((appointment) => {
        const appointmentStart = appointment.start.toDate();
        const appointmentEnd = appointment.end.toDate();

        // Check if appointment overlaps with the current slot
        return (
          // Appointment starts during the slot
          (appointmentStart >= slotStart && appointmentStart < slotEnd) ||
          // Appointment ends during the slot
          (appointmentEnd > slotStart && appointmentEnd <= slotEnd) ||
          // Appointment spans the entire slot
          (appointmentStart <= slotStart && appointmentEnd >= slotEnd)
        );
      });

      // Calculate remaining capacity
      const remainingCapacity = maxCapacityPerSlot - appointmentsInSlot.length;

      // Format time for display (e.g., "9:00 AM")
      const formattedTime = slotStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Add slot to array
      timeSlots.push({
        time: formattedTime,
        date: new Date(slotStart),
        remainingCapacity,
        available: remainingCapacity > 0,
        slotStart,
        slotEnd,
        bookedCount: appointmentsInSlot.length,
        isBooked: appointmentsInSlot.some((a) => a.userId === userId),
      });

      // Move to next slot
      currentDate.setHours(hour + 1);
    }

    return timeSlots;
  }, [appointments, selectedDate, userId]);

  // Filter by time of day
  const filteredSlots = useMemo(() => {
    if (filterOption === "all") return slots;
    return slots.filter((s) => {
      const hr = s.date.getHours();
      if (filterOption === "morning") return hr >= 6 && hr < 12;
      if (filterOption === "afternoon") return hr >= 12 && hr < 17;
      if (filterOption === "evening") return hr >= 17 && hr < 23;
      return true;
    });
  }, [slots, filterOption]);

  // Stats
  const availabilityStats = useMemo(() => {
    const total = filteredSlots.length;
    const available = filteredSlots.filter((s) => !s.available).length;
    return {
      total,
      available,
      percent: total ? Math.round((available / total) * 100) : 0,
    };
  }, [filteredSlots]);

  // Reserve
  const bookSlot = async (slot) => {
    if (!userId) {
      return Alert.alert("Please log in", "You need to be signed in to book.", [
        { text: "OK" },
      ]);
    }
    if (bookingInProgress) return;
    setBookingInProgress(true);

    try {
      if (!slot.available) {
        throw new Error("Slot is full");
      }
      const ref = doc(db, "businesses", HOSPITAL_ID);
      const snap = await getDoc(ref);
      const business = snap.data();
      const appointment = {
        userId: userId,
        clinicianId: business.owner_id,
        businessId: HOSPITAL_ID,
        businessName: business.name,
        start: slot.slotStart,
        end: slot.slotEnd,
        reason: "medical",
        status: "pending",
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, "appointments"), appointment);
      Alert.alert("Success", "Your appointment has been scheduled.");

      const msg = "Appointment booked!";
      if (Platform.OS === "android") {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert("Success", msg);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Could not book", e.message || "Try again later.");
    } finally {
      setBookingInProgress(false);
    }
  };

  // Cancel
  const cancelSlot = async (slot) => {
    if (!userId) return;
    if (bookingInProgress) return;
    setBookingInProgress(true);

    try {
      const snap = await getDoc(slot.ref);
      const data = snap.data();
      if (!(data.booked ?? []).includes(userId)) {
        throw new Error("You’re not booked here");
      }
      await updateDoc(slot.ref, {
        booked: arrayRemove(userId),
        lastUpdated: Timestamp.now(),
      });
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                booked: (s.booked ?? []).filter((u) => u !== userId),
              }
            : s
        )
      );
      Alert.alert("Cancelled", "Your reservation has been cancelled.");
    } catch (e) {
      console.error(e);
      Alert.alert("Could not cancel", e.message || "Try again later.");
    } finally {
      setBookingInProgress(false);
    }
  };

  // Date picker item
  const renderDateOption = ({ item }) => {
    const isSel =
      item.getDate() === selectedDate.getDate() &&
      item.getMonth() === selectedDate.getMonth();
    return (
      <TouchableOpacity
        style={[styles.dateOption, isSel && styles.selectedDateOption]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dateDay, isSel && styles.selectedDateText]}>
          {format(item, "EEE")}
        </Text>
        <Text style={[styles.dateNumber, isSel && styles.selectedDateText]}>
          {format(item, "d")}
        </Text>
      </TouchableOpacity>
    );
  };

  // Time-of-day filters
  const renderTimeFilter = () => (
    <View style={styles.filterContainer}>
      {["all", "morning", "afternoon", "evening"].map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.filterButton,
            filterOption === opt && styles.filterButtonActive,
          ]}
          onPress={() => setFilterOption(opt)}
        >
          <Text
            style={[
              styles.filterText,
              filterOption === opt && styles.filterTextActive,
            ]}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Slot card
  const renderItem = ({ item }) => {
    const start = item.slotStart;
    const end = item.slotEnd;
    const duration = differenceInMinutes(end, start);
    const spotsLeft = item.remainingCapacity || 0;
    const isFull = !item.available;
    const isBooked = item.isBooked;

    return (
      <Animated.View style={[styles.slotCard, { opacity: fadeAnim }]}>
        <View style={styles.slotInfo}>
          <Text style={styles.time}>{format(start, "h:mm a")}</Text>
          <Text style={styles.duration}>{duration} min</Text>
          <View
            style={[
              styles.availabilityBadge,
              isFull && styles.fullBadge,
              isBooked && styles.bookedBadge,
            ]}
          >
            <Text
              style={[
                styles.availabilityText,
                isFull && styles.fullText,
                isBooked && styles.bookedText,
              ]}
            >
              {isBooked
                ? "Booked ✓"
                : isFull
                ? "Full"
                : `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.btn,
            isBooked ? styles.btnBooked : isFull ? styles.btnFull : null,
            bookingInProgress && styles.btnDisabled,
          ]}
          disabled={bookingInProgress}
          onPress={() => (isBooked ? cancelSlot(item) : bookSlot(item))}
        >
          <Text style={[styles.btnText, isFull && styles.btnTextFull]}>
            {isBooked ? "Cancel" : isFull ? "Full" : "Reserve"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Empty state
  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No available slots</Text>
      <Text style={styles.emptySubtitle}>Try another date or time</Text>
    </View>
  );

  // Loading / Error
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8008" />
          <Text style={styles.loadingText}>Loading slots...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setupRealtimeListener()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  console.log(clinicImage, clinicId, "clinicImage");
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.clinicHeader}>
              {clinicImage && (
                <Image
                  source={{ uri: clinicImage }}
                  style={styles.clinicImage}
                />
              )}
              <View style={styles.clinicInfo}>
                <Text style={styles.clinicTitle}>{clinicTitle}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {availabilityStats.available}
                    </Text>
                    <Text style={styles.statLabel}>Slots Available</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {availabilityStats.percent}%
                    </Text>
                    <Text style={styles.statLabel}>Availability</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.dateSection}>
              <Text style={styles.dateHeader}>
                {formatDateHeader(selectedDate)}
              </Text>
              <FlatList
                data={dateOptions}
                renderItem={renderDateOption}
                keyExtractor={(d) => d.toISOString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateList}
              />
            </View>

            {renderTimeFilter()}
          </>
        }
        data={filteredSlots}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF8008"]}
            tintColor="#FF8008"
          />
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF8008",
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Clinic Header
  clinicHeader: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  clinicImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  clinicInfo: {
    flex: 1,
    justifyContent: "center",
  },
  clinicTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF8008",
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
  },

  // Date Picker
  dateSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dateHeader: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  dateList: {
    paddingVertical: 4,
  },
  dateOption: {
    width: 56,
    height: 70,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#e2e8f0",
    borderWidth: 1,
  },
  selectedDateOption: {
    backgroundColor: "#FF8008",
    borderColor: "#FF8008",
    shadowColor: "#FF8008",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  dateDay: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  selectedDateText: {
    color: "#ffffff",
  },

  // Time Filters
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderRadius: 8,
    borderColor: "#e2e8f0",
    borderWidth: 1,
    backgroundColor: "#f8fafc",
  },
  filterButtonActive: {
    backgroundColor: "#e0f2fe",
    borderColor: "#FF8008",
  },
  filterText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FF8008",
    fontWeight: "600",
  },

  // Slot Cards
  slotCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  slotInfo: {
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#e0f2fe",
    alignSelf: "flex-start",
  },
  fullBadge: {
    backgroundColor: "#fee2e2",
  },
  bookedBadge: {
    backgroundColor: "#dbeafe",
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF8008",
  },
  fullText: {
    color: "#ef4444",
  },
  bookedText: {
    color: "#FFA41B",
  },

  // Action Button
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FF8008",
    minWidth: 80,
    alignItems: "center",
  },
  btnFull: {
    backgroundColor: "#f1f5f9",
  },
  btnBooked: {
    backgroundColor: "#FFA41B",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  btnTextFull: {
    color: "#94a3b8",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#94a3b8",
  },
});
