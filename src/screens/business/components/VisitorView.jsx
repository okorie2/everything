import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth } from "../../../../backend/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const VisitorView = ({ business }) => {
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState("date");
  const [showPicker, setShowPicker] = useState(false);

  const showDatePicker = () => {
    setMode("date");
    setShowPicker(true);
  };

  const showTimePicker = () => {
    setMode("time");
    setShowPicker(true);
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleBookAppointment = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Please sign in to book.");

    const startTime = Timestamp.fromDate(date);
    const endTime = Timestamp.fromDate(
      new Date(date.getTime() + 30 * 60 * 1000)
    );

    const appointment = {
      userId: user.uid,
      clinicianId: business.owner_id,
      businessId: business.id,
      start: startTime,
      end: endTime,
      status: "pending",
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "appointments"), appointment);
      Alert.alert("Success", "Appointment booked.");
    } catch (err) {
      console.error("Booking failed:", err);
      Alert.alert("Error", "Could not book appointment.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{business.name}</Text>
      <Text style={styles.category}>{business.category}</Text>

      <TouchableOpacity style={styles.button} onPress={showDatePicker}>
        <Text style={styles.buttonText}>Select Date</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showTimePicker}>
        <Text style={styles.buttonText}>Select Time</Text>
      </TouchableOpacity>

      <Text style={styles.selectedDate}>
        {date.toLocaleDateString()} {date.toLocaleTimeString()}
      </Text>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={handleBookAppointment}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode={mode}
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

export default VisitorView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a2a6c",
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#eee",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    color: "#333",
  },
  selectedDate: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
    color: "#444",
  },
  bookButton: {
    backgroundColor: "#FF8008",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
