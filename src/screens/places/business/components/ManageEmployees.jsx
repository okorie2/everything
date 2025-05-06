import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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

/* props: { business } */
export default function ManageEmployees({ business }) {
  /* ── state ───────────────────────────────────────────────────────── */
  const [allUsers, setAllUsers] = useState([]); // dropdown items
  const [empList, setEmpList] = useState(business.employees || []);
  const [roleMap, setRoleMap] = useState({}); // { uid: 'manager' }
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null); // dropdown value
  const [processing, setProcessing] = useState(false);

  const toast = (msg, ok = true) =>
    Toast.show(msg, {
      backgroundColor: ok ? "#1a2a6c" : "#f44336",
      textColor: "#fff",
    });

  /* ── initial fetch ──────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      /* users for dropdown */
      const usersSnap = await getDocs(collection(db, "user"));
      const items = usersSnap.docs.map((d) => ({
        label: `${d.data().first_name} ${d.data().last_name}`,
        value: d.id,
        icon: () => <Ionicons name="person-outline" size={16} color="#666" />,
      }));
      setAllUsers(items);

      /* existing roles */
      const roleSnap = await getDocs(
        collection(db, "businesses", business.business_id, "roles")
      );
      const map = {};
      roleSnap.docs.forEach((d) => (map[d.id] = d.data().role));
      setRoleMap(map);
    })();
  }, [business.business_id]);

  /* ── helpers ────────────────────────────────────────────────────── */
  const addEmployee = async () => {
    if (!value) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "businesses", business.business_id), {
        employees: arrayUnion(value),
      });
      setEmpList((list) => [...list, value]); // optimistic UI
      toast("Employee added!");
    } catch (e) {
      console.error(e);
      toast("Failed to add employee.", false);
    }
    setProcessing(false);
    setValue(null);
  };

  const removeEmployee = (uid) =>
    Alert.alert("Remove employee?", "", [
      { text: "Cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setProcessing(true);
          try {
            await updateDoc(doc(db, "businesses", business.business_id), {
              employees: arrayRemove(uid),
            });
            setEmpList((list) => list.filter((x) => x !== uid));
            toast("Employee removed");
          } catch (e) {
            console.error(e);
            toast("Failed to remove.", false);
          }
          setProcessing(false);
        },
      },
    ]);

  const changeRole = async (uid, next) => {
    setProcessing(true);
    try {
      await setDoc(
        doc(db, "businesses", business.business_id, "roles", uid),
        { role: next },
        { merge: true }
      );
      setRoleMap((m) => ({ ...m, [uid]: next }));
      toast(`Role set to ${next}`);
    } catch (e) {
      console.error(e);
      toast("Failed to change role.", false);
    }
    setProcessing(false);
  };

  /* ── render helpers ─────────────────────────────────────────────── */
  const people = allUsers.filter((u) => empList.includes(u.value));

  const renderRow = ({ item }) => {
    const role = roleMap[item.value] || "staff";
    const next = role === "manager" ? "staff" : "manager";
    return (
      <View style={S.row}>
        <Ionicons name="person-circle" size={22} color="#1a2a6c" />
        <Text style={S.rowText}>{item.label}</Text>

        <Text style={[S.badge, role === "manager" && S.badgeMgr]}>{role}</Text>

        <TouchableOpacity
          style={S.roleBtn}
          onPress={() => changeRole(item.value, next)}
        >
          <Text style={S.roleTxt}>
            {role === "manager" ? "Demote" : "Promote"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => removeEmployee(item.value)}>
          <Ionicons name="trash-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    );
  };

  /* ── header comp (scrolls with list) ────────────────────────────── */
  const ListHeader = () => (
    <View>
      <Text style={S.title}>Manage Employees</Text>

      <DropDownPicker
        open={open}
        value={value}
        items={allUsers}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setAllUsers}
        placeholder="Select user to add"
        zIndex={3000} /* keeps dropdown above list */
        zIndexInverse={1000}
        style={S.dd}
      />

      <TouchableOpacity
        style={[S.addBtn, !value && { opacity: 0.35 }]}
        disabled={!value || processing}
        onPress={addEmployee}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={S.addTxt}>Add Employee</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  /* ── UI (FlatList with header) ─────────────────────────────────── */
  return (
    <FlatList
      data={people}
      keyExtractor={(item) => item.value}
      renderItem={renderRow}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <Text style={{ marginTop: 12 }}>No employees yet.</Text>
      }
      contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

/* ── styles ───────────────────────────────────────────────────────── */
const S = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2a6c",
    marginBottom: 12,
  },
  dd: { borderColor: "#E0E7FF", marginBottom: 12 },
  addBtn: {
    backgroundColor: "#FF8008",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addTxt: { color: "#fff", fontWeight: "600" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },
  rowText: { flex: 1, marginLeft: 10, fontSize: 14 },
  badge: {
    backgroundColor: "#9993",
    color: "#555",
    fontSize: 11,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeMgr: { backgroundColor: "#4caf5055", color: "#2e7d32" },
  roleBtn: {
    backgroundColor: "#FF8008",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 8,
  },
  roleTxt: { color: "#fff", fontSize: 10 },
});
