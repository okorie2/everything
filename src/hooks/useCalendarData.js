import { useState, useCallback, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

/**
 * Custom hook to load calendar events for a user
 * @param {Object} db - Firestore database instance
 * @param {string} uid - Current user ID
 * @returns {Object} Calendar data and loading state
 */
/**
 * Custom hook to load calendar events for a user with permission handling
 * @param {Object} db - Firestore database instance
 * @param {string} uid - Current user ID
 * @param {Object} auth - Firebase auth instance (optional)
 * @param {boolean} enableRealtime - Whether to enable realtime updates (default: true)
 * @returns {Object} Calendar data and loading state
 */
export const useCalendarData = (
  db,
  uid,
  auth = null,
  enableRealtime = true
) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Define refresh function outside the loadData function
  // so it can be used in useEffect dependencies
  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    if (!db || !uid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Skip user verification - we'll rely on Firebase Auth
      // and security rules instead of explicit document checks

      const allEvents = [];
      const today = new Date();
      const no_of_milliseconds_in_7_days = 7 * 24 * 60 * 60 * 1000;
      const endDate = new Date(today.getTime() + no_of_milliseconds_in_7_days);

      // Wrap each main data fetch in try/catch to prevent one failure from breaking everything

      try {
        // 1. Fetch businesses owned by this user
        const businessIds = await fetchUserBusinesses(db, uid);

        // 2. For each business, get clinic slots
        for (const bizId of businessIds) {
          try {
            const clinicData = await fetchBusinessClinics(db, bizId);

            for (const [clinicId, clinicName] of Object.entries(clinicData)) {
              try {
                const slotEvents = await fetchClinicSlots(
                  db,
                  bizId,
                  clinicId,
                  clinicName,
                  uid,
                  today,
                  endDate
                );
                allEvents.push(...slotEvents);
              } catch (clinicError) {
                console.error(
                  `Error processing clinic ${clinicId}:`,
                  clinicError
                );
                // Continue with other clinics
              }
            }
          } catch (businessError) {
            console.error(`Error processing business ${bizId}:`, businessError);
            // Continue with other businesses
          }
        }
      } catch (businessFetchError) {
        console.error("Error fetching businesses:", businessFetchError);
        // Continue to appointments
      }

      try {
        // 3. Add custom appointments (visitor → owner bookings)
        const appointmentEvents = await fetchUserAppointments(db, uid, today);
        allEvents.push(...appointmentEvents);
      } catch (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        // Continue with what we have
      }

      setEvents(allEvents);
    } catch (err) {
      console.error("Calendar load failed:", err);
      // More specific error message based on the error type
      if (err.code === "permission-denied") {
        setError("Insufficient permissions to access calendar data");
      } else if (err.message && err.message.includes("not authenticated")) {
        setError("Authentication required to access calendar data");
      } else {
        setError(
          "Unable to load calendar: " + (err.message || "Unknown error")
        );
      }
      setEvents([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [db, uid]);

  // Set up realtime listeners for updates
  useEffect(() => {
    if (!db || !uid || !enableRealtime) return;

    const unsubscribers = [];

    // 1. Listen for changes to user's appointments
    const userAppointmentsQuery = query(
      collection(db, "appointments"),
      where("userId", "==", uid)
    );

    const userAppointmentsUnsubscribe = onSnapshot(
      userAppointmentsQuery,
      (snapshot) => {
        // If any changes detected, refresh the calendar
        if (!snapshot.empty) {
          refresh();
        }
      },
      (error) => {
        console.error("Error in user appointments listener:", error);
      }
    );
    unsubscribers.push(userAppointmentsUnsubscribe);

    // 2. Listen for changes to clinician's appointments
    const clinicianAppointmentsQuery = query(
      collection(db, "appointments"),
      where("clinicianId", "==", uid)
    );

    const clinicianAppointmentsUnsubscribe = onSnapshot(
      clinicianAppointmentsQuery,
      (snapshot) => {
        // If any changes detected, refresh the calendar
        if (!snapshot.empty) {
          refresh();
        }
      },
      (error) => {
        console.error("Error in clinician appointments listener:", error);
      }
    );
    unsubscribers.push(clinicianAppointmentsUnsubscribe);

    // Clean up listeners on unmount or when dependencies change
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [db, uid, enableRealtime, refresh]);

  // Initialize data loading
  useEffect(() => {
    if (db && uid) {
      loadData();
    }
  }, [db, uid, loadData]);

  return {
    events,
    isLoading,
    refreshing,
    error,
    loadData,
    refresh,
  };
};

// Helper functions
async function fetchUserBusinesses(db, uid) {
  try {
    // Query businesses where user is owner OR member
    const ownerBusinessesSnap = await getDocs(
      query(collection(db, "businesses"), where("owner_id", "==", uid))
    );

    // For querying membership, we need to handle potential array-contains issues
    // Use a more reliable query that works regardless of how membership is stored
    const memberBusinessesSnap = await getDocs(collection(db, "businesses"));

    // Filter on the client side for businesses where the user is a member
    // This is more reliable than array-contains which can be problematic
    const memberBusinesses = memberBusinessesSnap.docs.filter((doc) => {
      const data = doc.data();
      return (
        data.members &&
        Array.isArray(data.members) &&
        data.members.includes(uid)
      );
    });

    // Combine both results, removing duplicates
    const businessIds = new Set([
      ...ownerBusinessesSnap.docs.map((doc) => doc.id),
      ...memberBusinesses.map((doc) => doc.id),
    ]);

    return Array.from(businessIds);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    // Re-throw to be handled by the main try/catch
    throw error;
  }
}

async function fetchBusinessClinics(db, bizId) {
  const clinicSnap = await getDocs(
    collection(db, "businesses", bizId, "clinics")
  );

  const clinicNames = {};
  clinicSnap.docs.forEach((doc) => {
    clinicNames[doc.id] = doc.data().title ?? doc.id;
  });

  return clinicNames;
}

async function fetchClinicSlots(
  db,
  bizId,
  clinicId,
  clinicName,
  uid,
  today,
  endDate
) {
  try {
    const slotsRef = collection(
      db,
      "businesses",
      bizId,
      "clinics",
      clinicId,
      "slots"
    );

    // Modify query to avoid index requirements - use single field query
    // and filter the rest client-side
    const q = query(slotsRef);

    const snap = await getDocs(q);
    const slotEvents = [];

    snap.docs.forEach((docSnap) => {
      const s = docSnap.data();

      // Client-side date filtering
      const slotStart = s.start?.toDate();
      if (!slotStart || slotStart < today || slotStart >= endDate) {
        return; // Skip slots outside date range
      }

      const status = s.status ?? "open";

      // Handle potential undefined clinician_id or booked array
      const clinicianId = s.clinician_id || "";
      const bookedArray = s.booked || [];

      const isDoc = clinicianId === uid;
      const isPat = Array.isArray(bookedArray) && bookedArray.includes(uid);

      if (!isDoc && !isPat) return;

      slotEvents.push({
        id: `slot-${docSnap.id}`,
        title: isDoc
          ? isPat
            ? "My own appointment"
            : `Patient slot (${status === "booked" ? "Booked" : "Open"})`
          : "My appointment",
        start: slotStart,
        end: s.end?.toDate() || new Date(slotStart.getTime() + 3600000), // Default 1 hour if end missing
        color: isDoc
          ? status === "booked"
            ? "#2563EB"
            : "#93C5FD"
          : "#16A34A",
        slotPath: docSnap.ref.path,
        clinicName: clinicName,
        status,
        patientCount: Array.isArray(bookedArray) ? bookedArray.length : 0,
        clinicianId: clinicianId,
        type: "slot",
      });
    });

    return slotEvents;
  } catch (error) {
    console.error(`Error fetching slots for clinic ${clinicId}:`, error);
    return []; // Return empty array rather than breaking the entire function
  }
}

async function fetchUserAppointments(db, uid, today) {
  try {
    let appointmentEvents = [];

    // Approach 1: Try to use a simple query first that doesn't require composite indexes
    try {
      // First query: Get all appointments for this user as patient
      const userAppointmentsSnap = await getDocs(
        query(collection(db, "appointments"), where("userId", "==", uid))
      );

      // Process user appointments, filtering by date in memory
      userAppointmentsSnap.forEach((docSnap) => {
        const a = docSnap.data();

        // Only include appointments that are today or later
        if (a.start && a.start.toDate() >= today) {
          appointmentEvents.push({
            id: `appt-${docSnap.id}`,
            title: "My Appointment",
            start: a.start.toDate(),
            end: a.end.toDate(),
            color: "#16A34A",
            clinicianId: a.clinicianId || "",
            userId: a.userId || "",
            docPath: docSnap.ref.path,
            type: "appointment",
            // Additional details for the appointment
            description: a.description || "No description provided",
            notes: a.notes || "",
            reason: a.reason || "",
            status: a.status || "scheduled",
            clinicName: a.clinicName || "Unknown Clinic",
            patientName: a.patientName || "",
            clinicianName: a.clinicianName || "",
            // Include full appointment data for access to any field
            fullData: a,
          });
        }
      });
    } catch (userApptError) {
      console.error("Error fetching user's appointments:", userApptError);
    }

    // Second query: Get all appointments for this user as clinician
    try {
      const clinicianAppointmentsSnap = await getDocs(
        query(collection(db, "appointments"), where("clinicianId", "==", uid))
      );

      // Process clinician appointments, filtering by date in memory
      clinicianAppointmentsSnap.forEach((docSnap) => {
        const a = docSnap.data();

        // Only include appointments that are today or later
        if (a.start && a.start.toDate() >= today) {
          appointmentEvents.push({
            id: `appt-${docSnap.id}`,
            title: "Client Appointment",
            start: a.start.toDate(),
            end: a.end.toDate(),
            color: "#2563EB",
            clinicianId: a.clinicianId || "",
            userId: a.userId || "",
            docPath: docSnap.ref.path,
            type: "appointment",
            // Additional details for the appointment
            description: a.description || "No description provided",
            notes: a.notes || "",
            reason: a.reason || "",
            status: a.status || "scheduled",
            clinicName: a.clinicName || "Unknown Clinic",
            patientName: a.patientName || "",
            clinicianName: a.clinicianName || "",
            // Include full appointment data for access to any field
            fullData: a,
          });
        }
      });
    } catch (clinicianApptError) {
      console.error(
        "Error fetching clinician's appointments:",
        clinicianApptError
      );
    }

    return appointmentEvents;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    console.error("Error details:", error.code, error.message);
    return []; // Return empty array rather than breaking the entire function
  }
}
