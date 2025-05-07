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
    const clinicId = business.id;
    const slotId = "selectedSlotId"; // Replace with the selected slot ID
    const slotStart = new Date(); // Example of slot start time

    // Create the appointment in Firestore
    const appointmentRef = doc(collection(db, "appointments"));
    const appointmentData = {
      userId,
      clinicianId: business.clinician_id,
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
      <View style={styles.header}>
        <Text style={styles.name}>{business.name}</Text>
        <Text style={styles.category}>{business.category}</Text>
      </View>
      
      <View style={styles.contentSection}>
        <Text style={styles.address}>{business.address}</Text>
        <Text style={styles.description}>{business.description}</Text>
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactDetail}>
          <Text style={styles.contactLabel}>Email:</Text>
          <Text style={styles.contactText}>{business.contact_info?.email || "N/A"}</Text>
        </View>
        <View style={styles.contactDetail}>
          <Text style={styles.contactLabel}>Phone:</Text>
          <Text style={styles.contactText}>{business.contact_info?.phone || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleBookAppointment}>
          <Text style={styles.buttonText}>Book Appointment</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtonsRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleEmail}
          >
            <Text style={styles.secondaryButtonText}>Send Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCall}
          >
            <Text style={styles.secondaryButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default VisitorView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
    marginBottom: 20,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 6,
  },
  category: {
    fontSize: 16,
    color: "#888888",
  },
  contentSection: {
    marginBottom: 24,
  },
  address: {
    fontSize: 15,
    color: "#666666",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444444",
  },
  contactSection: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  contactDetail: {
    flexDirection: "row",
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 15,
    color: "#666666",
    width: 60,
  },
  contactText: {
    fontSize: 15,
    color: "#444444",
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#FF8008",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondaryButton: {
    flex: 0.48,
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  secondaryButtonText: {
    color: "#555555",
    fontWeight: "500",
  },
});