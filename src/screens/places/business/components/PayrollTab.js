import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import Papa from "papaparse";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { db } from "../../../../../backend/firebase";

export default function PayrollTab({ business, payPeriod }) {
  /* rows = { uid, name, hours, rate } */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      /* 1. fetch worklogs for the period */
      const logsQ = query(
        collection(db, "businesses", business.business_id, "worklogs"),
        where("pay_period_id", "==", payPeriod)
      );
      const logSnap = await getDocs(logsQ);
      const hoursByEmp = {};
      logSnap.docs.forEach((d) => {
        const { employee_id, hours = 0 } = d.data();
        hoursByEmp[employee_id] = (hoursByEmp[employee_id] || 0) + hours;
      });

      /* 2. fetch roles for rates + names */
      const rolesSnap = await getDocs(
        collection(db, "businesses", business.business_id, "roles")
      );
      const list = rolesSnap.docs.map((r) => {
        const { hourly_rate = 0, name = r.id.slice(0, 6) } = r.data();
        const uid = r.id;
        return {
          uid,
          name,
          rate: hourly_rate,
          hours: hoursByEmp[uid] || 0,
        };
      });
      setRows(list);
      setLoading(false);
    })();
  }, [business.business_id, payPeriod]);

  /* export + lock */
  const lockAndExport = async () => {
    if (rows.length === 0) return;
    /* a. lock period */
    await setDoc(
      doc(db, "businesses", business.business_id, "pay_periods", payPeriod),
      { locked: true, closed_at: new Date() },
      { merge: true }
    );
    /* b. CSV */
    const csv = Papa.unparse(
      rows.map((r) => ({
        Employee: r.name,
        Hours: r.hours.toFixed(2),
        Rate: r.rate.toFixed(2),
        Gross: (r.hours * r.rate).toFixed(2),
      }))
    );
    const path = FileSystem.documentDirectory + `payroll_${payPeriod}.csv`;
    await FileSystem.writeAsStringAsync(path, csv);
    await Sharing.shareAsync(path);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  const renderRow = ({ item }) => (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text style={{ flex: 2 }}>{item.name}</Text>
      <Text style={{ flex: 1, textAlign: "right" }}>
        {item.hours.toFixed(2)}
      </Text>
      <Text style={{ flex: 1, textAlign: "right" }}>
        {item.rate.toFixed(2)}
      </Text>
      <Text style={{ flex: 1, textAlign: "right" }}>
        {(item.hours * item.rate).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
        Payroll &nbsp;•&nbsp; {payPeriod}
      </Text>

      {/* table header */}
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        <Text style={{ flex: 2, fontWeight: "700" }}>Employee</Text>
        <Text style={{ flex: 1, textAlign: "right", fontWeight: "700" }}>
          Hours
        </Text>
        <Text style={{ flex: 1, textAlign: "right", fontWeight: "700" }}>
          Rate
        </Text>
        <Text style={{ flex: 1, textAlign: "right", fontWeight: "700" }}>
          Gross
        </Text>
      </View>

      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(i) => i.uid}
      />

      <TouchableOpacity
        onPress={lockAndExport}
        style={{
          backgroundColor: "#FF8008",
          marginTop: 16,
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Lock & Export CSV
        </Text>
      </TouchableOpacity>
    </View>
  );
}
