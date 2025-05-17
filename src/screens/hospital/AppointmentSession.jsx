import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";

// Mock data for staff members - replace with your API call
const STAFF_MEMBERS = [
  {
    id: "staff1",
    name: "Dr. Sarah Johnson",
    role: "General Physician",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    specialization: "Family Medicine",
    experience: "8 years",
  },
  {
    id: "staff2",
    name: "Dr. Michael Chen",
    role: "Cardiologist",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    specialization: "Heart Health",
    experience: "12 years",
  },
  {
    id: "staff3",
    name: "Dr. Emily Rodriguez",
    role: "Pediatrician",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    specialization: "Child Health",
    experience: "10 years",
  },
  {
    id: "staff4",
    name: "Dr. James Wilson",
    role: "Dermatologist",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    specialization: "Skin Conditions",
    experience: "15 years",
  },
];

const AppointmentSessionScreen = ({ navigation, route }) => {
  // You can pass appointmentId or other params through route if needed
  const appointmentDate = route?.params?.appointmentDate || new Date();

  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    stats: {
      duration: 0,
      started: null,
      completed: null,
    },
    appointmentDay: moment(appointmentDate).format("YYYY-MM-DD"),
    staffId: "",
    symptoms: "",
    diagnosis: "",
    prescription: [],
    attendingStaff: null,
  });

  // Mock function to simulate getting diagnosis and prescription
  const submitSymptoms = async () => {
    if (!selectedStaff) {
      Alert.alert("Error", "Please select a staff member first");
      return;
    }

    if (!symptoms.trim()) {
      Alert.alert("Error", "Please describe your symptoms");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock response - this would come from your API
      const mockDiagnosis =
        "Based on your symptoms, you appear to have a mild upper respiratory infection.";
      const mockPrescription = [
        {
          id: "med1",
          name: "Amoxicillin",
          dosage: "500mg",
          frequency: "Every 8 hours",
          duration: "7 days",
          instructions: "Take with food",
        },
        {
          id: "med2",
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "Every 6 hours as needed",
          duration: "3 days",
          instructions: "Take for fever or pain",
        },
      ];

      // Update appointment data
      const now = new Date();
      setAppointmentData({
        stats: {
          duration: 15, // minutes
          started: appointmentData.stats.started || now.toISOString(),
          completed: now.toISOString(),
        },
        appointmentDay: moment(appointmentDate).format("YYYY-MM-DD"),
        staffId: selectedStaff.id,
        symptoms: symptoms,
        diagnosis: mockDiagnosis,
        prescription: mockPrescription,
        attendingStaff: selectedStaff,
      });

      setSessionComplete(true);

      // Here you would save the data to your backend
      // saveAppointmentData(appointmentData);
    } catch (error) {
      console.error("Error submitting symptoms:", error);
      Alert.alert(
        "Error",
        "Failed to process your symptoms. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setSelectedStaff(null);
    setSymptoms("");
    setSessionComplete(false);
    setAppointmentData({
      stats: {
        duration: 0,
        started: null,
        completed: null,
      },
      appointmentDay: moment(new Date()).format("YYYY-MM-DD"),
      staffId: "",
      symptoms: "",
      diagnosis: "",
      prescription: [],
      attendingStaff: null,
    });
  };

  const bookNewAppointment = () => {
    // Navigate to booking screen
    navigation.navigate("BookAppointment");
  };

  // Start the session timer when staff is selected
  useEffect(() => {
    if (selectedStaff && !appointmentData.stats.started) {
      setAppointmentData((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          started: new Date().toISOString(),
        },
        staffId: selectedStaff.id,
        attendingStaff: selectedStaff,
      }));
    }
  }, [selectedStaff]);

  const renderStaffSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Healthcare Provider</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.staffList}
      >
        {STAFF_MEMBERS.map((staff) => (
          <TouchableOpacity
            key={staff.id}
            style={[
              styles.staffCard,
              selectedStaff?.id === staff.id && styles.selectedStaffCard,
            ]}
            onPress={() => setSelectedStaff(staff)}
          >
            <Image source={{ uri: staff.avatar }} style={styles.staffAvatar} />
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{staff.name}</Text>
              <Text style={styles.staffRole}>{staff.role}</Text>
              <View style={styles.staffExperience}>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.staffExperienceText}>
                  {staff.experience}
                </Text>
              </View>
            </View>
            {selectedStaff?.id === staff.id && (
              <View style={styles.selectedCheckmark}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSymptomsInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Describe Your Symptoms</Text>
      <View style={styles.symptomsContainer}>
        <TextInput
          style={styles.symptomsInput}
          multiline
          placeholder="Please describe what you're experiencing in detail..."
          value={symptoms}
          onChangeText={setSymptoms}
          editable={!sessionComplete}
        />
        {!sessionComplete && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedStaff || !symptoms.trim()) && styles.disabledButton,
            ]}
            onPress={submitSymptoms}
            disabled={loading || !selectedStaff || !symptoms.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit</Text>
                <Ionicons name="send" size={16} color="white" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderDiagnosisAndPrescription = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnosis</Text>
        <View style={styles.diagnosisContainer}>
          <Ionicons
            name="medical"
            size={24}
            color="#FF8C00"
            style={styles.diagnosisIcon}
          />
          <Text style={styles.diagnosisText}>{appointmentData.diagnosis}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prescription</Text>
        {appointmentData.prescription.map((med, index) => (
          <View key={med.id} style={styles.prescriptionItem}>
            <View style={styles.prescriptionHeader}>
              <View style={styles.prescriptionNumberContainer}>
                <Text style={styles.prescriptionNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Text style={styles.medicationDosage}>{med.dosage}</Text>
            </View>
            <View style={styles.prescriptionDetails}>
              <View style={styles.prescriptionDetail}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.prescriptionDetailText}>
                  {med.frequency}
                </Text>
              </View>
              <View style={styles.prescriptionDetail}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.prescriptionDetailText}>
                  {med.duration}
                </Text>
              </View>
              <View style={styles.prescriptionDetail}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color="#666"
                />
                <Text style={styles.prescriptionDetailText}>
                  {med.instructions}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.ctaContainer}>
        <Text style={styles.ctaText}>Need another consultation?</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={bookNewAppointment}>
          <Text style={styles.ctaButtonText}>Book New Appointment</Text>
          <Ionicons name="calendar" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {sessionComplete ? "Appointment Summary" : "Appointment Session"}
        </Text>
        {sessionComplete && (
          <TouchableOpacity style={styles.resetButton} onPress={resetSession}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.appointmentInfo}>
          <View style={styles.appointmentDate}>
            <Ionicons name="calendar" size={20} color="#FF8C00" />
            <Text style={styles.appointmentDateText}>
              {moment(appointmentDate).format("dddd, MMMM D, YYYY")}
            </Text>
          </View>

          {sessionComplete && appointmentData.stats.duration > 0 && (
            <View style={styles.sessionDuration}>
              <Ionicons name="time" size={20} color="#FF8C00" />
              <Text style={styles.sessionDurationText}>
                {appointmentData.stats.duration} min session
              </Text>
            </View>
          )}
        </View>

        {!sessionComplete && renderStaffSelection()}
        {renderSymptomsInput()}
        {sessionComplete && renderDiagnosisAndPrescription()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#FF8C00",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  resetButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appointmentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentDate: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentDateText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  sessionDuration: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDurationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  staffList: {
    paddingBottom: 8,
  },
  staffCard: {
    width: 150,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#eee",
    position: "relative",
  },
  selectedStaffCard: {
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: "#f0fff0",
  },
  staffAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    alignSelf: "center",
  },
  staffInfo: {
    alignItems: "center",
  },
  staffName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 6,
  },
  staffExperience: {
    flexDirection: "row",
    alignItems: "center",
  },
  staffExperienceText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  selectedCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  symptomsContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  symptomsInput: {
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#FF8C00",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 8,
  },
  diagnosisContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff9f0",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8C00",
  },
  diagnosisIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  diagnosisText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  prescriptionItem: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  prescriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f0f0",
  },
  prescriptionNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  prescriptionNumber: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  medicationName: {
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
  },
  medicationDosage: {
    fontSize: 14,
    color: "#FF8C00",
    fontWeight: "500",
  },
  prescriptionDetails: {
    padding: 12,
  },
  prescriptionDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  prescriptionDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  ctaContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ctaText: {
    fontSize: 16,
    marginBottom: 16,
    color: "#333",
  },
  ctaButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  ctaButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 8,
  },
});

export default AppointmentSessionScreen;
