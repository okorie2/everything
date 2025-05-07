import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  addDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../../../backend/firebase"; // adjust the path if needed

export default function ClockWidget({ bizId }) {
  const uid = auth.currentUser.uid;
  const [openLog, setOpenLog] = useState(null); // open worklog (if any)
  const [busy, setBusy] = useState(false);

  /* Check on mount: do I already have an open log today? */
  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "businesses", bizId, "worklogs"),
        where("employee_id", "==", uid),
        where("clock_out", "==", null)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setOpenLog({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    })();
  }, [bizId]);

  /* Clock-in = create new worklog */
  const clockIn = async () => {
    setBusy(true);
    await addDoc(collection(db, "businesses", bizId, "worklogs"), {
      employee_id: uid,
      clock_in: serverTimestamp(),
      clock_out: null,
      hours: null,
      pay_period_id: new Date().toISOString().slice(0, 7), // yyyy-MM
    });
    setBusy(false);
    setOpenLog({}); // placeholder until listener refresh
  };

  /* Clock-out = close the open log */
  const clockOut = async () => {
    if (!openLog) return;
    setBusy(true);
    const now = new Date();
    const inTs = openLog.clock_in.toDate();
    const hrs = Math.round(((now - inTs) / 3600000) * 100) / 100; // 2-dp

    await updateDoc(doc(db, "businesses", bizId, "worklogs", openLog.id), {
      clock_out: now,
      hours: hrs,
    });
    setBusy(false);
    setOpenLog(null);
  };

  if (busy) return <ActivityIndicator style={{ marginBottom: 16 }} />;

  return (
    <View style={{ marginBottom: 16 }}>
      {openLog ? (
        <TouchableOpacity
          onPress={clockOut}
          style={{
            backgroundColor: "#DC2626",
            paddingVertical: 14,
            borderRadius: 8,
          }}
        >
          <Text
            style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}
          >
            CLOCK OUT
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={clockIn}
          style={{
            backgroundColor: "#16A34A",
            paddingVertical: 14,
            borderRadius: 8,
          }}
        >
          <Text
            style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}
          >
            CLOCK IN
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
