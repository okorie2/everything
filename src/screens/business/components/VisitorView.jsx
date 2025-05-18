import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth } from "../../../../backend/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

// Define theme colors to match BusinessDetailScreen
const COLORS = {
  primary: "#FF8008", // Orange - active primary
  secondary: "#1a2a6c", // Deep blue
  background: "#f8f9fa",
  card: "#ffffff",
  text: "#333333",
  textLight: "#767676",
  border: "#e0e0e0",
};

const VisitorView = ({ business }) => {
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState("date");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerPosition, setDatePickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const [timePickerPosition, setTimePickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const [reason, setReason] = useState("");

  // Format the date and time for display
  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenDatePicker = (event) => {
    // On iOS, we use the native picker modal behavior
    if (Platform.OS === "ios") {
      setMode("date");
      setShowDatePicker(true);
      return;
    }

    // On Android, we'll try to position the picker near the button
    // Store measurements for modal positioning
    if (event && event.nativeEvent) {
      const { pageY } = event.nativeEvent;
      setDatePickerPosition({
        top: pageY + 5, // Position just below the button
        left: 16, // Align with container padding
      });
    }

    setMode("date");
    setShowDatePicker(true);
  };

  const handleOpenTimePicker = (event) => {
    // On iOS, we use the native picker modal behavior
    if (Platform.OS === "ios") {
      setMode("time");
      setShowTimePicker(true);
      return;
    }

    // On Android, we'll try to position the picker near the button
    if (event && event.nativeEvent) {
      const { pageY } = event.nativeEvent;
      setTimePickerPosition({
        top: pageY + 5, // Position just below the button
        left: 16, // Align with container padding
      });
    }

    setMode("time");
    setShowTimePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      // Keep the time part from the current date
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes());
      setDate(newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);

    if (selectedTime) {
      // Keep the date part from the current date
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleBookAppointment = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Please sign in to book.");

    // Validate reason field
    if (!reason.trim()) {
      return Alert.alert(
        "Missing information",
        "Please provide a reason for your appointment."
      );
    }

    const startTime = Timestamp.fromDate(date);
    const endTime = Timestamp.fromDate(
      new Date(date.getTime() + 30 * 60 * 1000)
    );

    const appointment = {
      userId: user.uid,
      clinicianId: business.owner_id,
      businessId: business.business_id,
      businessName: business.name,
      start: startTime,
      end: endTime,
      reason: reason.trim(),
      status: "pending",
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "appointments"), appointment);
      Alert.alert("Success", "Your appointment has been scheduled.");
      // Reset reason field after successful booking
      setReason("");
    } catch (err) {
      console.error("Booking failed:", err);
      Alert.alert("Error", "Could not book appointment.");
    }
  };

  // Custom picker container for Android to provide better positioning
  const renderAndroidDatePicker = () => {
    if (!showDatePicker) return null;

    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <DateTimePicker
                testID="datePicker"
                value={date}
                mode="date"
                is24Hour={false}
                display="calendar"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderAndroidTimePicker = () => {
    if (!showTimePicker) return null;

    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <DateTimePicker
                testID="timePicker"
                value={date}
                mode="time"
                is24Hour={false}
                display="clock"
                onChange={handleTimeChange}
                style={styles.picker}
              />
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // iOS picker - uses native behavior
  const renderIOSPicker = () => {
    if (Platform.OS !== "ios") return null;

    if (showDatePicker) {
      return (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      );
    }

    if (showTimePicker) {
      return (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.name}>{business.name}</Text>
          <Text style={styles.category}>{business.category}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Schedule an Appointment</Text>

          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.labelText}>Date</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={handleOpenDatePicker}
              >
                <Text style={styles.valueText}>{formatDate(date)}</Text>
                <Text style={styles.iconText}>📅</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.labelText}>Time</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={handleOpenTimePicker}
              >
                <Text style={styles.valueText}>{formatTime(date)}</Text>
                <Text style={styles.iconText}>⏰</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reasonContainer}>
              <Text style={styles.labelText}>Reason for Appointment</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Please describe the reason for your visit"
                placeholderTextColor={COLORS.textLight}
                value={reason}
                onChangeText={setReason}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
              {reason.length > 0 && (
                <Text style={styles.charCount}>
                  {reason.length} character{reason.length !== 1 ? "s" : ""}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, !reason.trim() && styles.disabledButton]}
            onPress={handleBookAppointment}
            disabled={!reason.trim()}
          >
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Render the appropriate picker for the platform */}
      {Platform.OS === "android" ? (
        <>
          {renderAndroidDatePicker()}
          {renderAndroidTimePicker()}
        </>
      ) : (
        renderIOSPicker()
      )}
    </KeyboardAvoidingView>
  );
};

export default VisitorView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  dateTimeContainer: {
    marginBottom: 24,
  },
  dateContainer: {
    marginBottom: 16,
  },
  timeContainer: {
    marginBottom: 16,
  },
  reasonContainer: {
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  selector: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  valueText: {
    fontSize: 16,
    color: COLORS.text,
  },
  iconText: {
    fontSize: 16,
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
    opacity: 0.7,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  // Custom picker modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    position: "absolute",
    width: "90%",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  pickerCloseButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  picker: {
    marginTop: 8,
  },
});
