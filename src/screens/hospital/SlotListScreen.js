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
  Dimensions,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  updateDoc,
  arrayUnion,
  Timestamp,
  doc,
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

const { width: windowWidth } = Dimensions.get("window");
const fadeAnim = new Animated.Value(0);

export default function SlotListScreen({ route, navigation }) {
  const { clinicId, clinicTitle, clinicImage } = route.params;
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [filterOption, setFilterOption] = useState("all"); // all|morning|afternoon|evening

  const userId = auth.currentUser?.uid;

  // Prepare next 14 days for the date-picker
  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
    []
  );

  // Format the “Today / Tomorrow / Wed, Jul 7” header
  const formatDateHeader = useCallback((d) => {
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
  }, []);

  // Build a Firestore query **for the selectedDate** and subscribe in real-time
  const setupRealtimeListener = useCallback(() => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const q = query(
      collection(db, "businesses", HOSPITAL_ID, "clinics", clinicId, "slots"),
      where("status", "==", "open"),
      where("start", ">=", Timestamp.fromDate(start)),
      where("start", "<=", Timestamp.fromDate(end)),
      orderBy("start")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setError(null);
        const arr = snap.docs.map((d) => ({
          id: d.id,
          ref: d.ref,
          ...d.data(),
        }));
        setSlots(arr);
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

    return unsub;
  }, [clinicId, selectedDate]);

  // Initial + whenever selectedDate changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = setupRealtimeListener();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return unsubscribe;
  }, [setupRealtimeListener]);

  const onRefresh = () => {
    setRefreshing(true);
    // we already have a real-time listener, so just clear the flag
    setTimeout(() => setRefreshing(false), 500);
  };

  // Filter for morning/afternoon/evening
  const filteredSlots = useMemo(() => {
    let out = slots;
    if (filterOption !== "all") {
      out = out.filter((s) => {
        const hr = s.start.toDate().getHours();
        if (filterOption === "morning") return hr >= 6 && hr < 12;
        if (filterOption === "afternoon") return hr >= 12 && hr < 17;
        if (filterOption === "evening") return hr >= 17 && hr < 23;
        return true;
      });
    }
    return out;
  }, [slots, filterOption]);

  // Availability stats
  const availabilityStats = useMemo(() => {
    const total = filteredSlots.length;
    const available = filteredSlots.filter(
      (s) => (s.booked ?? []).length < s.capacity
    ).length;
    return {
      total,
      available,
      percent: total ? Math.round((available / total) * 100) : 0,
    };
  }, [filteredSlots]);

  // Booking action
  const bookSlot = async (slot) => {
    if (!userId) {
      return Alert.alert("Please log in", "You need to be signed in to book.", [
        { text: "OK" },
      ]);
    }
    if (bookingInProgress) return;
    setBookingInProgress(true);

    try {
      // Re-fetch to avoid race
      const snap = await slot.ref.get();
      const data = snap.data();
      if ((data.booked ?? []).length >= data.capacity) {
        throw new Error("Slot is full");
      }
      await updateDoc(slot.ref, {
        booked: arrayUnion(userId),
        lastUpdated: Timestamp.now(),
      });
      Alert.alert("Booked!", "Your appointment is confirmed.");
      navigation.navigate("AppointmentConfirmation", {
        clinicTitle,
        appointmentTime: slot.start.toDate(),
        appointmentId: slot.id,
        clinicId,
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Could not book", e.message || "Try again later.");
    } finally {
      setBookingInProgress(false);
    }
  };

  // Date‐picker header
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

  // Time‐of‐day filter buttons
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
    const start = item.start.toDate();
    const end = item.end.toDate();
    const duration = differenceInMinutes(end, start);
    const bookedCount = (item.booked ?? []).length;
    const spotsLeft = item.capacity - bookedCount;
    const isFull = spotsLeft <= 0;
    const isBooked = (item.booked ?? []).includes(userId);
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
            <Text style={styles.availabilityText}>
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
            isFull && styles.btnFull,
            isBooked && styles.btnBooked,
            bookingInProgress && styles.btnDisabled,
          ]}
          disabled={isFull || isBooked || bookingInProgress}
          onPress={() => bookSlot(item)}
        >
          <Text style={styles.btnText}>
            {isBooked ? "✔ Booked" : isFull ? "Full" : "Book Now"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Empty state
  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No slots on this day</Text>
    </View>
  );

  // Loading/Error
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading slots…</Text>
      </SafeAreaView>
    );
  }
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: "red" }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
                    <Text style={styles.statLabel}>Slots Left</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {availabilityStats.percent}%
                    </Text>
                    <Text style={styles.statLabel}>Avail.</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.dateHeader}>
                {formatDateHeader(selectedDate)}
              </Text>
              <FlatList
                data={dateOptions}
                renderItem={renderDateOption}
                keyExtractor={(d) => d.toISOString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>

            {renderTimeFilter()}
          </>
        }
        data={filteredSlots}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B" },

  clinicHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
  },
  clinicImage: { width: 80, height: 80, borderRadius: 8, marginRight: 16 },
  clinicInfo: { flex: 1, justifyContent: "center" },
  clinicTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  statsRow: { flexDirection: "row", marginTop: 8, alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#16A34A" },
  statLabel: { fontSize: 12, color: "#64748B" },
  statDivider: { width: 1, height: 24, backgroundColor: "#E2E8F0" },

  dateContainer: {
    padding: 12,
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
  },
  dateHeader: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  dateOption: {
    width: 60,
    height: 70,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#E2E8F0",
    borderWidth: 1,
  },
  selectedDateOption: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  dateDay: { fontSize: 12, color: "#64748B" },
  dateNumber: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  selectedDateText: { color: "#fff" },

  filterContainer: {
    flexDirection: "row",
    padding: 12,
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 8,
    borderColor: "#E2E8F0",
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: "#EAF5EA",
    borderColor: "#16A34A",
  },
  filterText: { fontSize: 14, color: "#64748B" },
  filterTextActive: { color: "#16A34A", fontWeight: "600" },

  slotCard: {
    flexDirection: "row",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotInfo: { flex: 1 },
  time: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  duration: { fontSize: 14, color: "#64748B", marginVertical: 4 },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#E0F2E9",
  },
  fullBadge: { backgroundColor: "#FEF2F2" },
  bookedBadge: { backgroundColor: "#EFF6FF" },
  availabilityText: { fontSize: 12, fontWeight: "500", color: "#16A34A" },

  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#16A34A",
  },
  btnFull: { backgroundColor: "#E2E8F0" },
  btnBooked: { backgroundColor: "#3B82F6" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700" },

  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyTitle: { fontSize: 18, color: "#64748B" },
});
