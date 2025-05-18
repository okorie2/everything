"use client";

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../backend/firebase";

// This is a standalone component for the enhanced patient record card
// You can import and use this in your profile screen or any other screen

const EnhancedPatientRecord = ({ record, onPress, userData }) => {
  const [staffInfo, setStaffInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffInfo = async () => {
      if (record.staffId) {
        try {
          const userDoc = doc(db, "user", record.staffId);
          const userSnapshot = await getDoc(userDoc);

          if (userSnapshot.exists()) {
            setStaffInfo(userSnapshot.data());
          }
        } catch (err) {
          console.error("Error fetching staff info:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchStaffInfo();
  }, [record.staffId]);

  // Format date to be more readable

  return (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status indicator */}
      <View style={styles.statusIndicator}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                record.status === "completed" ? "#4CAF50" : "#FF8008",
            },
          ]}
        />
      </View>

      {/* Main content */}
      <View style={styles.patientCardContent}>
        <View style={styles.patientCardLeft}>
          <Text style={styles.patientCondition} numberOfLines={1}>
            {record.condition || "General Checkup"}
          </Text>
          <Text style={styles.patientName} numberOfLines={1}>
            {userData?.firstName || "Patient"} {userData?.lastName || ""}
          </Text>
        </View>

        <View style={styles.patientCardRight}>
          <Text style={styles.patientAppointmentDay}>
            {record.appointmentDay}
          </Text>
          <View style={styles.timeContainer}>
            <MaterialIcons name="access-time" size={12} color="#999999" />
            <Text style={styles.patientAppointmentTime}>
              {record.appointmentStartTime || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Staff information section */}
      <View style={styles.staffInfoContainer}>
        <View style={styles.staffInfoDivider} />
        {loading ? (
          <Text style={styles.loadingText}>Loading staff info...</Text>
        ) : staffInfo ? (
          <View style={styles.staffInfoContent}>
            <MaterialIcons name="person" size={14} color="#666666" />
            <Text style={styles.staffInfoText}>
              Attended by: {staffInfo.first_name} {staffInfo.last_name}
            </Text>
            {staffInfo.specialization && (
              <View style={styles.specializationBadge}>
                <Text style={styles.specializationText}>
                  {staffInfo.specialization}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.staffInfoContent}>
            <MaterialIcons name="person-outline" size={14} color="#999999" />
            <Text style={[styles.staffInfoText, { color: "#999999" }]}>
              No staff information available
            </Text>
          </View>
        )}
      </View>

      {/* Additional details */}
      {record.diagnosis && (
        <View style={styles.diagnosisContainer}>
          <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
          <Text style={styles.diagnosisText} numberOfLines={1}>
            {record.diagnosis}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  patientCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#1a2a6c",
    position: "relative",
  },
  statusIndicator: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  patientCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  patientCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  patientCardRight: {
    alignItems: "flex-end",
  },
  patientCondition: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  patientName: {
    fontSize: 13,
    color: "#666666",
  },
  patientAppointmentDay: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientAppointmentTime: {
    fontSize: 11,
    color: "#999999",
    marginLeft: 4,
  },
  staffInfoContainer: {
    marginTop: 10,
  },
  staffInfoDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
  },
  staffInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  staffInfoText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 6,
    fontStyle: "italic",
  },
  loadingText: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
  },
  specializationBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  specializationText: {
    fontSize: 10,
    color: "#1976D2",
    fontWeight: "500",
  },
  diagnosisContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  diagnosisLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555555",
  },
  diagnosisText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 4,
    flex: 1,
  },
});

export default EnhancedPatientRecord;
