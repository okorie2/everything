import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../../../backend/firebase";
import { useFocusEffect } from "@react-navigation/native";

export default function QueueDetailScreen({ route, navigation }) {
  const { slotPath } = route.params;
  const slotRef = doc(db, slotPath);
  const [slot, setSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [patientDetails, setPatientDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Extract clinic and business information from path
  const pathParts = slotPath.split("/");
  const businessId = pathParts[1];
  const clinicId = pathParts[3];

  /* ── Load slot data and patient information ─────────── */
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Get slot data
          const slotSnap = await getDoc(slotRef);
          if (!slotSnap.exists()) {
            Alert.alert("Error", "Slot not found");
            navigation.goBack();
            return;
          }

          const slotData = { id: slotSnap.id, ...slotSnap.data() };
          setSlot(slotData);

          // Get patient information if available
          if (slotData.booked && slotData.booked.length > 0) {
            const patientUid = slotData.booked[0];
            const patientRef = doc(db, "users", patientUid);
            const patientSnap = await getDoc(patientRef);

            if (patientSnap.exists()) {
              setPatientDetails(patientSnap.data());
            }

            // Load existing notes if consultation is in progress
            if (slotData.consult_start && !slotData.consult_end) {
              const visitRef = doc(
                db,
                "businesses",
                businessId,
                "clinics",
                clinicId,
                "records",
                patientUid,
                "visits",
                slotData.id
              );
              const visitSnap = await getDoc(visitRef);
              if (visitSnap.exists() && visitSnap.data().notes) {
                setNotes(visitSnap.data().notes);
              }
            }
          }
        } catch (error) {
          //   console.error("Error fetching data:", error);
          //   Alert.alert("Error", "Failed to load appointment details");
        } finally {
          setLoading(false);
        }
      };

      fetchData();

      return () => {
        // Clean up function if needed
      };
    }, [slotPath, navigation])
  );

  /* ── Consultation handlers ─────────────────────────── */
  const startConsult = async () => {
    setSubmitting(true);
    try {
      await updateDoc(slotRef, {
        consult_start: Timestamp.now(),
        clinician_id: auth.currentUser.uid,
      });

      // Refresh slot data
      const updatedSnap = await getDoc(slotRef);
      setSlot({ id: updatedSnap.id, ...updatedSnap.data() });

      // Create initial visit record
      if (slot.booked && slot.booked.length > 0) {
        const patientUid = slot.booked[0];
        const visitRef = doc(
          db,
          "businesses",
          businessId,
          "clinics",
          clinicId,
          "records",
          patientUid,
          "visits",
          slot.id
        );

        await setDoc(
          visitRef,
          {
            start: Timestamp.now(),
            clinician_id: auth.currentUser.uid,
            status: "in_progress",
            notes: "",
          },
          { merge: true }
        );
      }

      Alert.alert("Success", "Consultation has started");
    } catch (error) {
      console.error("Error starting consult:", error);
      Alert.alert("Error", "Failed to start consultation");
    } finally {
      setSubmitting(false);
    }
  };

  const saveNotes = async () => {
    if (!slot || !slot.booked || slot.booked.length === 0) return;

    const patientUid = slot.booked[0];
    setSubmitting(true);

    try {
      const visitRef = doc(
        db,
        "businesses",
        businessId,
        "clinics",
        clinicId,
        "records",
        patientUid,
        "visits",
        slot.id
      );

      await updateDoc(visitRef, { notes });
      Alert.alert("Success", "Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      Alert.alert("Error", "Failed to save notes");
    } finally {
      setSubmitting(false);
    }
  };

  const endConsult = async () => {
    if (!notes.trim()) {
      Alert.alert(
        "Missing Information",
        "Please add consultation notes before ending",
        [{ text: "OK" }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const now = Timestamp.now();
      const patientUid = slot.booked[0];

      // 1) Update slot status
      await updateDoc(slotRef, {
        consult_end: now,
        status: "completed",
      });

      // 2) Update visit record
      const visitRef = doc(
        db,
        "businesses",
        businessId,
        "clinics",
        clinicId,
        "records",
        patientUid,
        "visits",
        slot.id
      );

      await updateDoc(visitRef, {
        end: now,
        notes,
        status: "completed",
        duration_minutes: Math.round(
          (now.toMillis() - slot.consult_start.toMillis()) / 60000
        ),
      });

      Alert.alert(
        "Consultation Completed",
        "Consultation has ended and records have been saved",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error ending consult:", error);
      Alert.alert("Error", "Failed to end consultation");
      setSubmitting(false);
    }
  };

  /* ── Render loading state ────────────────────────── */
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </SafeAreaView>
    );
  }

  /* ── Get patient information ────────────────────────── */
  const patientUid = slot?.booked?.[0];
  const patientName =
    patientDetails?.displayName || patientDetails?.name || "Patient";
  const patientInfo = [
    patientDetails?.phone && `Phone: ${patientDetails.phone}`,
    patientDetails?.email && `Email: ${patientDetails.email}`,
    patientDetails?.dob &&
      `DOB: ${new Date(patientDetails.dob.toDate()).toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join(" • ");

  /* ── Format appointment time ────────────────────────── */
  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.toDate()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const appointmentDate = slot?.start
    ? new Date(slot.start.toDate()).toLocaleDateString()
    : "N/A";
  const appointmentTime = slot?.start ? formatTime(slot.start) : "N/A";

  /* ── UI ───────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.h1}>Patient Consultation</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{appointmentDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={styles.infoValue}>{appointmentTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View
                style={[
                  styles.statusBadge,
                  slot.consult_end
                    ? styles.statusCompleted
                    : slot.consult_start
                    ? styles.statusInProgress
                    : styles.statusScheduled,
                ]}
              >
                <Text style={styles.statusText}>
                  {slot.consult_end
                    ? "Completed"
                    : slot.consult_start
                    ? "In Progress"
                    : "Scheduled"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Patient Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Information</Text>
          <View style={styles.cardContent}>
            <View style={styles.patientNameContainer}>
              <Text style={styles.patientName}>{patientName}</Text>
              {patientUid && (
                <Text style={styles.patientId}>
                  ID: {patientUid.substring(0, 8)}
                </Text>
              )}
            </View>
            {patientInfo && (
              <Text style={styles.patientMeta}>{patientInfo}</Text>
            )}
          </View>
        </View>

        {/* Consultation Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consultation Notes</Text>
          <View style={styles.cardContent}>
            <TextInput
              style={styles.notes}
              multiline
              placeholder="Enter consultation notes here..."
              value={notes}
              onChangeText={setNotes}
              editable={!!slot.consult_start && !slot.consult_end}
            />

            {slot.consult_start && !slot.consult_end && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveNotes}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnTxt}>Save Notes</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!slot.consult_start && (
            <TouchableOpacity
              style={styles.btn}
              onPress={startConsult}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.btnTxt}>Start Consultation</Text>
              )}
            </TouchableOpacity>
          )}

          {slot.consult_start && !slot.consult_end && (
            <TouchableOpacity
              style={[styles.btn, styles.endButton]}
              onPress={endConsult}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.btnTxt}>End Consultation</Text>
              )}
            </TouchableOpacity>
          )}

          {slot.consult_end && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>
                ✓ Consultation completed on {formatTime(slot.consult_end)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#475569",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 16 : 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "600",
  },
  h1: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  infoLabel: {
    width: 80,
    fontSize: 15,
    fontWeight: "500",
    color: "#64748B",
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusScheduled: {
    backgroundColor: "#E0F2FE",
  },
  statusInProgress: {
    backgroundColor: "#ECFDF5",
  },
  statusCompleted: {
    backgroundColor: "#F1F5F9",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  patientNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginRight: 8,
  },
  patientId: {
    fontSize: 12,
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  patientMeta: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  notes: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    minHeight: 150,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  btn: {
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  endButton: {
    backgroundColor: "#EF4444",
  },
  btnTxt: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  completedContainer: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  completedText: {
    color: "#16A34A",
    fontWeight: "500",
    fontSize: 16,
  },
});
