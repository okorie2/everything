import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";

const VisitorView = ({ business }) => {
  const handleBookAppointment = async () => {
    const userId = auth.currentUser.uid;
    const clinicId = business.id; // Assuming this is available as business.id
    const slotId = "selectedSlotId"; // Replace with the selected slot ID
    const slotStart = new Date(); // Example of slot start time

    // Create the appointment in Firestore
    const appointmentRef = doc(collection(db, "appointments"));
    const appointmentData = {
      userId,
      clinicianId: business.clinician_id, // Assuming business has clinician_id field
      slotId,
      start: Timestamp.fromDate(slotStart),
      status: "pending",
      createdAt: Timestamp.now(),
    };

    try {
      await setDoc(appointmentRef, appointmentData);
      Alert.alert("Success", "Appointment booked successfully!");

      // Optionally, update calendars for both the user and clinician here.
    } catch (error) {
      console.error("Error booking appointment:", error);
      Alert.alert("Error", "Failed to book appointment");
    }
  };
  const handleEmail = () => {
    if (business.contact_info?.email) {
      Linking.openURL(`mailto:${business.contact_info.email}`);
    } else {
      Alert.alert("No email contact available.");
    }
  };

  const handleCall = () => {
    if (business.contact_info?.phone) {
      Linking.openURL(`tel:${business.contact_info.phone}`);
    } else {
      Alert.alert("No phone contact available.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{business.name}</Text>
      <Text style={styles.category}>{business.category}</Text>
      <Text style={styles.address}>{business.address}</Text>
      <Text style={styles.description}>{business.description}</Text>

      <View style={styles.contactSection}>
        <Text style={styles.label}>Contact:</Text>
        <Text style={styles.contactText}>
          Email: {business.contact_info?.email || "N/A"}
        </Text>
        <Text style={styles.contactText}>
          Phone: {business.contact_info?.phone || "N/A"}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleBookAppointment}>
        <Text style={styles.buttonText}>Book Appointment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#1a2a6c" }]}
        onPress={handleEmail}
      >
        <Text style={styles.buttonText}>Send Email</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4CAF50" }]}
        onPress={handleCall}
      >
        <Text style={styles.buttonText}>Call</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VisitorView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a2a6c",
    marginBottom: 10,
  },
  category: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginBottom: 20,
  },
  contactSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a2a6c",
    marginBottom: 5,
  },
  contactText: {
    fontSize: 14,
    color: "#555",
  },
  button: {
    backgroundColor: "#FF8008",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
