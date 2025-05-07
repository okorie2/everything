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
  Dimensions,
} from "react-native";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  arrayUnion,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../../backend/firebase";
import {
  format,
  isToday,
  isTomorrow,
  addDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from "date-fns";
import { HOSPITAL_ID } from "../../constants/hospital";

const windowWidth = Dimensions.get("window").width;

export default function SlotListScreen({ route, navigation }) {
  const { clinicId, clinicTitle, clinicImage } = route.params;
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [subscription, setSubscription] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [filterOption, setFilterOption] = useState("all"); // 'all', 'morning', 'afternoon', 'evening'
  const fadeAnim = new Animated.Value(0);

  const userId = auth.currentUser?.uid;

  // Dates for the date selector
  const dateOptions = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  }, []);

  // Function to format date for header display
  const formatDateHeader = useCallback((date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  }, []);

  // Filter slots based on selected date and time preferences
  const filteredSlots = useMemo(() => {
    if (!slots) return [];

    const startOfSelectedDate = startOfDay(selectedDate);
    const endOfSelectedDate = endOfDay(selectedDate);

    let filtered = slots.filter((slot) => {
      const slotDate = slot.start.toDate();
      return slotDate >= startOfSelectedDate && slotDate <= endOfSelectedDate;
    });

    // Apply time of day filter
    if (filterOption !== "all") {
      filtered = filtered.filter((slot) => {
        const hours = slot.start.toDate().getHours();
        switch (filterOption) {
          case "morning":
            return hours >= 6 && hours < 12;
          case "afternoon":
            return hours >= 12 && hours < 17;
          case "evening":
            return hours >= 17 && hours < 23;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [slots, selectedDate, filterOption]);

  // Calculate availability statistics
  const availabilityStats = useMemo(() => {
    if (!filteredSlots.length)
      return { total: 0, available: 0, percentAvailable: 0 };

    const total = filteredSlots.length;
    const available = filteredSlots.filter(
      (slot) => slot.booked.length < slot.capacity
    ).length;

    return {
      total,
      available,
      percentAvailable: Math.round((available / total) * 100),
    };
  }, [filteredSlots]);

  // Set up header options and load initial data
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: clinicTitle,
      headerTitleStyle: styles.headerTitle,
      headerStyle: styles.headerStyle,
    });

    loadSlots();

    // Animation effect when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Clean up subscription when component unmounts
    return () => {
      if (subscription) {
        subscription();
      }
    };
  }, []);

  // Set up real-time listener for slot updates
  const setupRealtimeListener = useCallback(() => {
    // Get current time
    const now = new Date();

    // Query slots that are open and in the future
    const slotsQuery = query(
      collection(db, "businesses", HOSPITAL_ID, "clinics", clinicId, "slots"),
      where("status", "==", "open"),
      where("start", ">=", Timestamp.fromDate(now)),
      orderBy("start", "asc")
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      slotsQuery,
      (snapshot) => {
        const updatedSlots = snapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
        }));

        setSlots(updatedSlots);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Error in real-time listener:", err);
        setError("Failed to listen for updates. Please refresh manually.");
        setLoading(false);
        setRefreshing(false);
      }
    );

    setSubscription(unsubscribe);
  }, [clinicId]);

  // Load slots from Firestore
  const loadSlots = useCallback(async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      // Get current time
      const now = new Date();

      // Query slots that are open and in the future
      const slotsQuery = query(
        collection(db, "businesses", HOSPITAL_ID, "clinics", clinicId, "slots"),
        where("status", "==", "open"),
        where("start", ">=", Timestamp.fromDate(now)),
        orderBy("start", "asc")
      );

      const snap = await getDocs(slotsQuery);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ref: doc.ref,
        ...doc.data(),
      }));

      setSlots(data);

      // Set up real-time updates after initial load
      setupRealtimeListener();
    } catch (err) {
      console.error("Failed to load slots:", err);
      setError("Failed to load available slots. Please try again.");
      setSlots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicId, refreshing, setupRealtimeListener]);

  // Handle refresh action
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSlots();
  }, [loadSlots]);

  // Book a slot
  const bookSlot = async (slot) => {
    if (!userId) {
      Alert.alert(
        "Authentication Required",
        "Please log in to book an appointment.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }

    // Prevent double booking
    if (bookingInProgress) return;

    try {
      setBookingInProgress(true);

      // Check slot availability again before booking
      const slotRef = slot.ref;
      const slotSnapshot = await getDocs(doc(slotRef));
      const currentData = slotSnapshot.exists() ? slotSnapshot.data() : null;

      if (!currentData || currentData.booked.length >= currentData.capacity) {
        Alert.alert("Slot Unavailable", "This slot is no longer available.");
        return;
      }

      // Proceed with booking
      await updateDoc(slotRef, {
        booked: arrayUnion(userId),
        lastUpdated: Timestamp.now(),
      });

      // Show success message
      if (Platform.OS === "android") {
        ToastAndroid.show(
          "Appointment booked successfully!",
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert(
          "Booking Confirmed",
          "Your appointment has been successfully booked.",
          [{ text: "OK" }]
        );
      }

      // Update local state for immediate UI feedback
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id ? { ...s, booked: [...s.booked, userId] } : s
        )
      );

      // Navigate to confirmation screen with appointment details
      navigation.navigate("AppointmentConfirmation", {
        clinicTitle,
        appointmentTime: slot.start.toDate(),
        appointmentId: slot.id,
        clinicId,
      });
    } catch (err) {
      console.error("Booking error:", err);
      Alert.alert(
        "Booking Failed",
        "Unable to book this appointment. Please try again."
      );
    } finally {
      setBookingInProgress(false);
    }
  };

  const renderDateOption = ({ item }) => {
    const isSelected =
      item.getDate() === selectedDate.getDate() &&
      item.getMonth() === selectedDate.getMonth();

    const dayNumber = format(item, "d");
    const dayName = format(item, "EEE");

    return (
      <TouchableOpacity
        style={[styles.dateOption, isSelected && styles.selectedDateOption]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>
          {dayName}
        </Text>
        <Text
          style={[styles.dateNumber, isSelected && styles.selectedDateText]}
        >
          {dayNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimeFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterOption === "all" && styles.filterButtonActive,
        ]}
        onPress={() => setFilterOption("all")}
      >
        <Text
          style={[
            styles.filterText,
            filterOption === "all" && styles.filterTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filterOption === "morning" && styles.filterButtonActive,
        ]}
        onPress={() => setFilterOption("morning")}
      >
        <Text
          style={[
            styles.filterText,
            filterOption === "morning" && styles.filterTextActive,
          ]}
        >
          Morning
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filterOption === "afternoon" && styles.filterButtonActive,
        ]}
        onPress={() => setFilterOption("afternoon")}
      >
        <Text
          style={[
            styles.filterText,
            filterOption === "afternoon" && styles.filterTextActive,
          ]}
        >
          Afternoon
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filterOption === "evening" && styles.filterButtonActive,
        ]}
        onPress={() => setFilterOption("evening")}
      >
        <Text
          style={[
            styles.filterText,
            filterOption === "evening" && styles.filterTextActive,
          ]}
        >
          Evening
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => {
    const startTime = item.start.toDate();
    const endTime = item.end.toDate();
    const durationMinutes = differenceInMinutes(endTime, startTime);
    const formattedTime = format(startTime, "h:mm a");

    const availableSpots = item.capacity - item.booked.length;
    const isFull = availableSpots <= 0;
    const isBooked = item.booked.includes(userId);
    const slotsRemaining = isBooked
      ? "Booked"
      : isFull
      ? "Full"
      : `${availableSpots} spot${availableSpots !== 1 ? "s" : ""} left`;

    return (
      <Animated.View style={[styles.slotCard, { opacity: fadeAnim }]}>
        <View style={styles.slotInfo}>
          <Text style={styles.time}>{formattedTime}</Text>
          <Text style={styles.duration}>{durationMinutes} min</Text>
          <View
            style={[
              styles.availabilityBadge,
              isFull && styles.fullBadge,
              isBooked && styles.bookedBadge,
            ]}
          >
            <Text style={styles.availabilityText}>{slotsRemaining}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.btn,
            isFull ? styles.btnFull : null,
            isBooked ? styles.btnBooked : null,
            bookingInProgress && styles.btnDisabled,
          ]}
          disabled={isFull || isBooked || bookingInProgress}
          onPress={() => bookSlot(item)}
        >
          <Text style={styles.btnText}>
            {isBooked ? "Booked ✓" : isFull ? "Full" : "Book Now"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderClinicHeader = () => (
    <View style={styles.clinicHeaderContainer}>
      {clinicImage && (
        <Image source={{ uri: clinicImage }} style={styles.clinicImage} />
      )}

      <View style={styles.clinicInfoContainer}>
        <Text style={styles.clinicTitle}>{clinicTitle}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{availabilityStats.available}</Text>
            <Text style={styles.statLabel}>Available Slots</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {availabilityStats.percentAvailable}%
            </Text>
            <Text style={styles.statLabel}>Availability</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image style={styles.emptyImage} />
      <Text style={styles.emptyTitle}>No Available Slots</Text>
      <Text style={styles.emptySubtitle}>
        There are no appointments available for this day. Try selecting a
        different date or check back later.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setSelectedDate(new Date())}
      >
        <Text style={styles.emptyButtonText}>Go to Today</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading available slots...</Text>
      </SafeAreaView>
    );
  }

  if (error && !slots?.length) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSlots}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        ListHeaderComponent={
          <>
            {renderClinicHeader()}

            <View style={styles.dateContainer}>
              <Text style={styles.dateHeaderText}>
                {formatDateHeader(selectedDate)}
              </Text>
              <FlatList
                data={dateOptions}
                renderItem={renderDateOption}
                keyExtractor={(item) => item.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateList}
              />
            </View>

            {renderTimeFilter()}
          </>
        }
        data={filteredSlots}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#16A34A"]}
            tintColor="#16A34A"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerStyle: {
    backgroundColor: "#fff",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  clinicHeaderContainer: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FBFCFE",
  },
  clinicImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  clinicInfoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  clinicTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  dateContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  dateList: {
    paddingVertical: 4,
  },
  dateOption: {
    width: 60,
    height: 70,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedDateOption: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  dateDay: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  selectedDateText: {
    color: "#FFFFFF",
  },
  filterContainer: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterButtonActive: {
    backgroundColor: "#EAF5EA",
    borderColor: "#16A34A",
  },
  filterText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#16A34A",
    fontWeight: "600",
  },
  slotCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  slotInfo: {
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 6,
  },
  availabilityBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#E0F2E9",
  },
  fullBadge: {
    backgroundColor: "#FEF2F2",
  },
  bookedBadge: {
    backgroundColor: "#EFF6FF",
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#16A34A",
  },
  btn: {
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  btnFull: {
    backgroundColor: "#E2E8F0",
  },
  btnBooked: {
    backgroundColor: "#3B82F6",
  },
  btnDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: windowWidth * 0.7,
  },
  emptyButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
