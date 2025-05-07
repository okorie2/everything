import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../../../backend/firebase";

const COLORS = {
  card: "#ffffff",
  text: "#1a2a6c",
  border: "#E5E7EB",
  revenue: "#16A34A",
  employees: "#2563EB",
  deadlines: "#DC2626",
};

export default function SnapshotCards({ business }) {
  const [revenue, setRevenue] = useState(null); // number
  const [employeeCount, setEmployeeCount] = useState(
    business.employees?.length || 0
  );
  const [dueSoon, setDueSoon] = useState(null); // number
  const usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  /* 1 — Total revenue THIS MONTH (paid invoices) */
  useEffect(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const invoicesQ = query(
      collection(db, "businesses", business.business_id, "invoices"),
      where("status", "==", "paid"),
      where("paid_at", ">=", Timestamp.fromDate(firstOfMonth))
    );

    const unsub = onSnapshot(invoicesQ, (snap) => {
      let sum = 0;
      snap.forEach((d) => {
        sum += d.data().amount || 0;
      });
      setRevenue(sum);
    });
    return unsub;
  }, [business.business_id]);

  /* 2 — Employee count (reacts to array changes) */
  useEffect(() => {
    setEmployeeCount(business.employees?.length || 0);
  }, [business.employees]);

  /* 3 — Upcoming deadlines (next 7 d, not completed) */
  useEffect(() => {
    const sevenDays = new Date(Date.now() + 7 * 864e5);
    (async () => {
      const tasksSnap = await getDocs(
        collection(db, "businesses", business.business_id, "tasks")
      );
      const count = tasksSnap.docs.filter((d) => {
        const data = d.data();
        if (data.status === "completed") return false;
        if (!data.due_date) return false;
        const due = data.due_date.seconds * 1000;
        return due <= sevenDays.getTime();
      }).length;
      setDueSoon(count);
    })();
  }, [business.business_id]);

  /* Loading state: show once all three numbers populated */
  const loading = revenue === null || dueSoon === null;

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  const Card = ({ label, value, color }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Card
        label="Revenue this month"
        value={usd.format(revenue)} // ← instead of `₦ ${revenue.toLocaleString()}`
        color={COLORS.revenue}
      />
      <Card label="Employees" value={employeeCount} color={COLORS.employees} />
      <Card label="Deadlines ≤ 7 d" value={dueSoon} color={COLORS.deadlines} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  value: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  label: { fontSize: 12, color: COLORS.text },
});
