"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../backend/firebase";

// Constants for colors - matching the dashboard
const COLORS = {
  primary: "#FF8008", // Orange (active primary)
  secondary: "#1a2a6c", // Deep blue
  background: "#f8f9fa",
  cardBg: "#ffffff",
  textPrimary: "#333333",
  textSecondary: "#666666",
  textLight: "#999999",
  pending: "#FF8008",
  inProgress: "#3498db",
  completed: "#2ecc71",
  urgent: "#e74c3c",
  border: "#eeeeee",
};

const PatientRecordScreen = ({ route, navigation }) => {
  const { record } = route.params;
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);

  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (!record.patientid) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, "user", record.patientid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          setPatientInfo(userSnapshot.data());
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching patient info:", err);
        setLoading(false);
      }
    };

    const fetchStaffInfo = async () => {
      if (!record.staffId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, "user", record.staffId);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          setStaffInfo(userSnapshot.data());
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching staff info:", err);
        setLoading(false);
      }
    };

    const fetchInfo = async () => {
      await Promise.all([fetchPatientInfo(), fetchStaffInfo()]);
    };

    fetchInfo();
  }, [record]);

  // Format timestamp to readable date and time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format duration in minutes to hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "N/A";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading patient record...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Record</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Info Card */}
        <View style={styles.card}>
          <View style={styles.patientInfoHeader}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientInitials}>
                {patientInfo?.first_name?.[0] || "P"}
                {patientInfo?.last_name?.[0] || ""}
              </Text>
            </View>
            <View style={styles.patientDetails}>
              <Text style={styles.patientName}>
                {patientInfo?.first_name || ""}{" "}
                {patientInfo?.last_name || "Unknown Patient"}
              </Text>
              {patientInfo?.phone && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="phone"
                    size={14}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.infoText}>{patientInfo.phone}</Text>
                </View>
              )}
              {patientInfo?.email && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="email"
                    size={14}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.infoText}>{patientInfo.email}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Staff Info Card */}
        {staffInfo && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Attending Staff</Text>
            </View>

            <View style={styles.patientInfoHeader}>
              <View style={[styles.patientAvatar, styles.staffAvatar]}>
                <Text style={styles.patientInitials}>
                  {staffInfo?.first_name?.[0] || "S"}
                  {staffInfo?.last_name?.[0] || ""}
                </Text>
              </View>
              <View style={styles.patientDetails}>
                <Text style={styles.patientName}>
                  {staffInfo?.first_name || ""}{" "}
                  {staffInfo?.last_name || "Unknown Staff"}
                </Text>
                {staffInfo?.specialization && (
                  <View style={styles.specializationBadge}>
                    <Text style={styles.specializationText}>
                      {staffInfo.specialization}
                    </Text>
                  </View>
                )}
                {staffInfo?.phone && (
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="phone"
                      size={14}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.infoText}>{staffInfo.phone}</Text>
                  </View>
                )}
                {staffInfo?.email && (
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="email"
                      size={14}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.infoText}>{staffInfo.email}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Appointment Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="event" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Appointment Details</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{record.appointmentDay}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {record.appointmentStartTime} - {record.appointmentEndTime}
              </Text>
            </View>

            {record.stats && (
              <>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Started</Text>
                  <Text style={styles.detailValue}>
                    {record.stats.started
                      ? new Date(record.stats.started).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Completed</Text>
                  <Text style={styles.detailValue}>
                    {record.stats.completed
                      ? new Date(record.stats.completed).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "N/A"}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {formatDuration(record.stats.duration)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Medical Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5
              name="notes-medical"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>Medical Information</Text>
          </View>

          <View style={styles.medicalInfo}>
            <View style={styles.medicalInfoItem}>
              <Text style={styles.medicalInfoLabel}>Condition</Text>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{record.condition}</Text>
              </View>
            </View>

            <View style={styles.medicalInfoItem}>
              <Text style={styles.medicalInfoLabel}>Symptoms</Text>
              <Text style={styles.medicalInfoValue}>
                {record.symptoms || "None reported"}
              </Text>
            </View>

            <View style={styles.medicalInfoItem}>
              <Text style={styles.medicalInfoLabel}>Diagnosis</Text>
              <Text style={styles.medicalInfoValue}>
                {record.diagnosis || "No diagnosis provided"}
              </Text>
            </View>
          </View>
        </View>

        {/* Prescription Card */}
        {record.prescription && record.prescription.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="medication"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.cardTitle}>Prescription</Text>
            </View>

            {record.prescription.map((med, index) => (
              <View key={med.id} style={styles.medicationItem}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDosage}>{med.dosage}</Text>
                </View>

                <View style={styles.medicationDetails}>
                  <View style={styles.medicationDetail}>
                    <MaterialIcons
                      name="schedule"
                      size={14}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.medicationDetailText}>
                      {med.frequency}
                    </Text>
                  </View>

                  <View style={styles.medicationDetail}>
                    <MaterialIcons
                      name="date-range"
                      size={14}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.medicationDetailText}>
                      {med.duration}
                    </Text>
                  </View>
                </View>

                {med.instructions && (
                  <View style={styles.medicationInstructions}>
                    <Text style={styles.instructionsLabel}>Instructions:</Text>
                    <Text style={styles.instructionsText}>
                      {med.instructions}
                    </Text>
                  </View>
                )}

                {index < record.prescription.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Record Metadata */}
        <View style={styles.metadataCard}>
          <Text style={styles.metadataText}>
            Created: {formatTimestamp(record.createdAt)}
          </Text>
          {record.updatedAt && (
            <Text style={styles.metadataText}>
              Updated: {formatTimestamp(record.updatedAt)}
            </Text>
          )}
          <Text style={styles.metadataText}>Record ID: {record.id}</Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      {/* <TouchableOpacity style={styles.actionButton}>
        <MaterialIcons name="print" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Print Record</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  patientInitials: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  detailItem: {
    width: "50%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  medicalInfo: {
    marginTop: 8,
  },
  medicalInfoItem: {
    marginBottom: 16,
  },
  medicalInfoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  medicalInfoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  conditionBadge: {
    backgroundColor: COLORS.secondary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  conditionText: {
    color: COLORS.secondary,
    fontWeight: "600",
    fontSize: 14,
  },
  medicationItem: {
    marginBottom: 16,
  },
  medicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  medicationDosage: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  medicationDetails: {
    flexDirection: "row",
    marginBottom: 8,
  },
  medicationDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  medicationDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  medicationInstructions: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  metadataCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  metadataText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  actionButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  staffAvatar: {
    backgroundColor: COLORS.primary, // Different color to distinguish from patient
  },
  specializationBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 6,
  },
  specializationText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 12,
  },
});

export default PatientRecordScreen;
