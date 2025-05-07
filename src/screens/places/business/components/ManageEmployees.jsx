import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-root-toast";
import { db } from "../../../../../backend/firebase"; // adjust if needed

export default function ManageEmployees({ business }) {
  /* dropdown state */
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUid, setSelectedUid] = useState(null);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);

  /* role map { uid: 'manager'|'staff',  uid+"_rate": number } */
  const [roleMap, setRoleMap] = useState({});

  /* ─────────── load users & roles once ─────────── */
  useEffect(() => {
    (async () => {
      /* user list */
      const snap = await getDocs(collection(db, "user"));
      setUserOptions(
        snap.docs.map((d) => ({
          label: `${d.data().first_name} ${d.data().last_name}`,
          value: d.id,
          icon: () => <Ionicons name="person-outline" size={16} color="#666" />,
        }))
      );

      /* roles */
      const rolesSnap = await getDocs(
        collection(db, "businesses", business.business_id, "roles")
      );
      const map = {};
      rolesSnap.docs.forEach((r) => {
        const { role = "staff", hourly_rate = 0 } = r.data();
        map[r.id] = role;
        map[r.id + "_rate"] = hourly_rate.toString();
      });
      setRoleMap(map);
    })();
  }, [business.business_id]);

  /* ─────────── helpers ─────────── */
  const toast = (msg, ok = true) =>
    Toast.show(msg, {
      backgroundColor: ok ? "#1a2a6c" : "#f44336",
      textColor: "#fff",
    });

  const addEmployee = async () => {
    if (!selectedUid) return;
    setWorking(true);
    await updateDoc(doc(db, "businesses", business.business_id), {
      employees: arrayUnion(selectedUid),
    });
    toast("Employee added");
    setSelectedUid(null);
    setOpen(false);
    setWorking(false);
  };

  const removeEmployee = (uid) =>
    Alert.alert("Remove employee?", "", [
      { text: "Cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setWorking(true);
          await updateDoc(doc(db, "businesses", business.business_id), {
            employees: arrayRemove(uid),
          });
          toast("Removed");
          setWorking(false);
        },
      },
    ]);

  const saveRole = async (uid, next) => {
    setWorking(true);
    await setDoc(
      doc(db, "businesses", business.business_id, "roles", uid),
      { role: next },
      { merge: true }
    );
    setRoleMap((r) => ({ ...r, [uid]: next }));
    toast("Role updated");
    setWorking(false);
  };

  const saveRate = async (uid) => {
    const rStr = roleMap[uid + "_rate"] || "0";
    const rate = parseFloat(rStr);
    if (isNaN(rate)) return toast("Enter a number", false);
    setWorking(true);
    await setDoc(
      doc(db, "businesses", business.business_id, "roles", uid),
      { hourly_rate: rate },
      { merge: true }
    );
    toast("Rate saved");
    setWorking(false);
  };

  /* list rows */
  const current = userOptions.filter((u) =>
    (business.employees || []).includes(u.value)
  );

  const Row = ({ item }) => {
    const uid = item.value;
    const role = roleMap[uid] || "staff";
    const next = role === "manager" ? "staff" : "manager";

    return (
      <View style={s.row}>
        <Ionicons name="person-circle" size={24} color="#1a2a6c" />
        <Text style={s.rowText}>{item.label}</Text>

        {/* badge */}
        <Text style={[s.badge, role === "manager" && s.badgeMgr]}>{role}</Text>

        {/* role toggle */}
        <TouchableOpacity style={s.roleBtn} onPress={() => saveRole(uid, next)}>
          <Text style={s.roleBtnTxt}>
            {role === "manager" ? "Demote" : "Promote"}
          </Text>
        </TouchableOpacity>

        {/* rate input */}
        <TextInput
          style={s.rateInput}
          value={roleMap[uid + "_rate"] || ""}
          onChangeText={(t) =>
            setRoleMap((r) => ({ ...r, [uid + "_rate"]: t }))
          }
          keyboardType="numeric"
          placeholder="Rate"
        />
        <TouchableOpacity style={s.rateSaveBtn} onPress={() => saveRate(uid)}>
          <Ionicons name="save" size={14} color="#fff" />
        </TouchableOpacity>

        {/* trash */}
        <TouchableOpacity onPress={() => removeEmployee(uid)}>
          <Ionicons name="trash-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    );
  };

  /* render */
  return (
    <View style={{ padding: 12 }}>
      <Text style={s.title}>Manage Employees</Text>

      <DropDownPicker
        open={open}
        value={selectedUid}
        items={userOptions}
        setOpen={setOpen}
        setValue={setSelectedUid}
        setItems={setUserOptions}
        placeholder="Select user to add"
        zIndex={3000}
        zIndexInverse={1000}
        style={{ marginBottom: 8 }}
      />

      <TouchableOpacity
        disabled={!selectedUid || working}
        style={[s.addBtn, (!selectedUid || working) && { opacity: 0.4 }]}
        onPress={addEmployee}
      >
        {working ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.addTxt}>Add Employee</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={current}
        keyExtractor={(i) => i.value}
        renderItem={Row}
        ListEmptyComponent={<Text>No employees yet.</Text>}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2a6c",
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: "#FF8008",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addTxt: { color: "#fff", fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  rowText: { flex: 1, marginLeft: 8 },
  badge: {
    backgroundColor: "#9993",
    paddingHorizontal: 6,
    borderRadius: 6,
    fontSize: 11,
  },
  badgeMgr: { backgroundColor: "#4caf5055", color: "#2e7d32" },
  roleBtn: {
    backgroundColor: "#FF8008",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 6,
  },
  roleBtnTxt: { color: "#fff", fontSize: 10 },
  rateInput: {
    width: 60,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    textAlign: "center",
    paddingVertical: 2,
    fontSize: 12,
    marginRight: 4,
  },
  rateSaveBtn: {
    backgroundColor: "#16A34A",
    padding: 4,
    borderRadius: 6,
    marginRight: 6,
  },
});
