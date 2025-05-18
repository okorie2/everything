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
import {
  doc,
  getDoc,
  addDoc,
  getDocs,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { db, auth } from "../../../backend/firebase";

const AppointmentSessionScreen = ({ navigation, route }) => {
  // You can pass appointmentId or other params through route if needed
  const { clinicId, item } = route?.params;
  const appointmentDate = item?.date;
  const appointmentStartTime = item?.slotStart;
  const appointmentEndTime = item?.slotEnd;
  const uid = auth.currentUser.uid;

  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffMembers, setStaffMembers] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    stats: {
      duration: 0,
      started: null,
      completed: null,
    },
    appointmentDay: moment(appointmentDate).format("YYYY-MM-DD"),
    appointmentStartTime: moment(appointmentStartTime).format("hh:mm:A"),
    appointmentEndTime: moment(appointmentEndTime).format("hh:mm:A"),
    staffId: "",
    symptoms: "",
    diagnosis: "",
    prescription: [],
    attendingStaff: null,
    patientid: uid,
  });

  // Helper function to save mock diagnosis and prescriptions to the database
  const seedMockMedicalData = async () => {
    // Check if we already have data in the database
    const querySnapshot = await getDocs(collection(db, "diagnoses"));

    if (!querySnapshot.empty) {
      console.log("Database already seeded with mock diagnoses");
      return;
    }

    // Mock diagnoses with matching prescriptions
    const mockMedicalData = [
      {
        condition: "Upper Respiratory Infection",
        diagnosis:
          "Based on your symptoms, you appear to have a mild upper respiratory infection.",
        prescriptions: [
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
        ],
      },
      {
        condition: "Seasonal Allergies",
        diagnosis:
          "Your symptoms suggest you are experiencing seasonal allergies. This is common during this time of year.",
        prescriptions: [
          {
            id: "med3",
            name: "Cetirizine",
            dosage: "10mg",
            frequency: "Once daily",
            duration: "As needed during allergy season",
            instructions: "Take preferably at night",
          },
          {
            id: "med4",
            name: "Fluticasone Nasal Spray",
            dosage: "1-2 sprays per nostril",
            frequency: "Once daily",
            duration: "As needed during allergy season",
            instructions: "Use after clearing nasal passages",
          },
        ],
      },
      {
        condition: "Gastroenteritis",
        diagnosis:
          "You appear to be suffering from viral gastroenteritis, commonly known as stomach flu.",
        prescriptions: [
          {
            id: "med5",
            name: "Oral Rehydration Solution",
            dosage: "200ml",
            frequency: "After each loose stool",
            duration: "Until symptoms subside",
            instructions: "Drink slowly to prevent vomiting",
          },
          {
            id: "med6",
            name: "Loperamide",
            dosage: "2mg",
            frequency: "After each loose stool (max 8mg/day)",
            duration: "2 days maximum",
            instructions:
              "Do not take if you have high fever or blood in stool",
          },
        ],
      },
      {
        condition: "Tension Headache",
        diagnosis:
          "You are experiencing a tension headache, likely due to stress or muscle tension in the neck and shoulders.",
        prescriptions: [
          {
            id: "med7",
            name: "Ibuprofen",
            dosage: "400mg",
            frequency: "Every 6-8 hours as needed",
            duration: "Not more than 3 days",
            instructions: "Take with food to avoid stomach upset",
          },
          {
            id: "med8",
            name: "Muscle Relaxant Cream",
            dosage: "Apply to affected areas",
            frequency: "2-3 times daily",
            duration: "As needed",
            instructions: "Massage gently into neck and shoulder muscles",
          },
        ],
      },
      {
        condition: "Mild Dermatitis",
        diagnosis:
          "Your skin condition appears to be a mild case of contact dermatitis, possibly from an allergen or irritant.",
        prescriptions: [
          {
            id: "med9",
            name: "Hydrocortisone Cream",
            dosage: "1% strength",
            frequency: "Apply thinly 2-3 times daily",
            duration: "7 days",
            instructions: "Avoid applying to broken skin",
          },
          {
            id: "med10",
            name: "Antihistamine Tablets",
            dosage: "10mg",
            frequency: "Once daily",
            duration: "7 days",
            instructions: "May cause drowsiness; avoid alcohol",
          },
        ],
      },
    ];

    try {
      console.log("Seeding database with mock medical data...");
      // Add each diagnosis to the database
      for (const data of mockMedicalData) {
        await addDoc(collection(db, "diagnoses"), {
          condition: data.condition,
          diagnosis: data.diagnosis,
          prescriptions: data.prescriptions,
          createdAt: serverTimestamp(),
        });
      }
      console.log("Database seeded successfully!");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  };

  //call seeding function
  useEffect(() => {
    const runSeeding = async () => {
      await seedMockMedicalData();
    };

    runSeeding();
  }, []);

  // Function to get a random diagnosis from the database
  const getRandomDiagnosis = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "diagnoses"));
      if (querySnapshot.empty) {
        throw new Error("No diagnoses found in the database");
      }

      const diagnoses = [];
      querySnapshot.forEach((doc) => {
        diagnoses.push({ id: doc.id, ...doc.data() });
      });

      // Select a random diagnosis
      const randomIndex = Math.floor(Math.random() * diagnoses.length);
      return diagnoses[randomIndex];
    } catch (error) {
      console.error("Error getting random diagnosis:", error);
      throw error;
    }
  };

  //function to save record to db
  const saveRecord = async (appointmentData) => {
    try {
      // Reference to the specific `records` collection for the given clinicId
      const docRef = await addDoc(
        collection(
          db,
          "businesses",
          "bethel-hospital",
          "clinics",
          clinicId,
          "records"
        ),
        {
          ...appointmentData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      console.log("Appointment saved with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error saving appointment:", error);
      throw error;
    }
  };

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
      // Get random diagnosis and prescription from database
      const randomMedicalData = await getRandomDiagnosis();

      // Update appointment data
      const now = new Date();
      const updatedAppointmentData = {
        stats: {
          duration: 15, // minutes
          started: appointmentData.stats.started || now.toISOString(),
          completed: now.toISOString(),
        },
        appointmentDay: moment(appointmentDate).format("YYYY-MM-DD"),
        appointmentStartTime: moment(appointmentStartTime).format("hh:mm:A"),
        appointmentEndTime: moment(appointmentEndTime).format("hh:mm:A"),
        staffId: selectedStaff.id,
        patientid: uid,
        symptoms: symptoms,
        diagnosis: randomMedicalData.diagnosis,
        prescription: randomMedicalData.prescriptions,
        condition: randomMedicalData.condition,
      };

      // Save the appointment data to the database
      await saveRecord(updatedAppointmentData);

      // Update state
      setAppointmentData(updatedAppointmentData);
      setSessionComplete(true);
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

  //query for staff members
  useEffect(() => {
    const fetchBethelHospitalStaff = async () => {
      setStaffLoading(true);
      console.log("clikced");
      try {
        // Get the specific hospital document directly by ID
        const hospitalDocRef = doc(db, "businesses", "bethel-hospital");
        const hospitalDoc = await getDoc(hospitalDocRef);

        if (!hospitalDoc.exists()) {
          console.log("Hospital not found");
          setStaffMembers([]);
          return;
        }

        // Get the hospital data
        const hospitalData = hospitalDoc.data();

        // Get the employee IDs array
        const employeeIds = hospitalData.employees || [];

        if (employeeIds.length === 0) {
          console.log("No employees found for this hospital");
          setStaffMembers([]);
          return;
        }

        // Fetch user data for each employee ID
        const staffData = [];

        // Process employee IDs in batches to avoid performance issues
        const batchSize = 10;
        for (let i = 0; i < employeeIds.length; i += batchSize) {
          const batch = employeeIds.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (userId) => {
              const userDocRef = doc(db, "user", userId);
              const userDoc = await getDoc(userDocRef);

              if (userDoc.exists()) {
                const userData = userDoc.data();

                // Handle potentially missing fields with fallbacks
                return {
                  id: userId,
                  name: [
                    userData.title || "",
                    userData.first_name || "",
                    userData.last_name || "",
                  ]
                    .filter(Boolean)
                    .join(" "),
                  role:
                    userData.role ||
                    userData.specialization ||
                    "Healthcare Provider",
                  avatar:
                    userData.profileImage || "https://via.placeholder.com/150",
                  specialization:
                    userData.specialization || userData.department || "",
                  experience:
                    userData.experience ||
                    `${Math.floor(Math.random() * 10) + 1} years`,
                };
              }
              return null;
            })
          );

          // Add valid results to staffData
          staffData.push(...batchResults.filter((staff) => staff !== null));
        }
        console.log(staffData);
        setStaffMembers(staffData);
      } catch (error) {
        console.error("Error fetching staff members:", error);
        Alert.alert(
          "Error",
          "Failed to load hospital staff. Please try again later."
        );
        // Keep the array empty on error
        setStaffMembers([]);
      } finally {
        setStaffLoading(false);
      }
    };

    fetchBethelHospitalStaff();
  }, []);

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

  // Helper function to generate initials from name
  const getInitials = (name) => {
    if (!name) return "??";

    const names = name.trim().split(" ");
    if (names.length === 1)
      return (names[0].charAt(0) + names[0].charAt(1)).toUpperCase();

    // Get first letter of first and last name
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  const renderStaffSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Healthcare Provider</Text>
      {staffLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>Loading staff members...</Text>
        </View>
      ) : staffMembers?.length === 0 ? (
        <View style={styles.noStaffContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF8C00" />
          <Text style={styles.noStaffText}>No staff members available</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.staffList}
        >
          {staffMembers?.map((staff) => (
            <TouchableOpacity
              key={staff.id}
              style={[
                styles.staffCard,
                selectedStaff?.id === staff.id && styles.selectedStaffCard,
              ]}
              onPress={() => setSelectedStaff(staff)}
            >
              {staff.avatar &&
              staff.avatar !== "https://via.placeholder.com/150" ? (
                <Image
                  source={{ uri: staff.avatar }}
                  style={styles.staffAvatar}
                />
              ) : (
                <View style={[styles.staffAvatar, styles.initialsAvatar]}>
                  <Text style={styles.initialsText}>
                    {getInitials(staff.name)}
                  </Text>
                </View>
              )}
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
      )}
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
  noStaffText: { textAlign: "center" },
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
  initialsAvatar: {
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
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
