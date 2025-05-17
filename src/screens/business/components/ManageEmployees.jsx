import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
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
import { db } from "../../../../backend/firebase"; // adjust if needed

export default function ManageEmployees({ business }) {
  /* dropdown state */
  const [userOptions, setUserOptions] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);

  /* role map { uid: 'manager'|'staff',  uid+"_rate": number } */
  const [roleMap, setRoleMap] = useState({});
  const [editingRate, setEditingRate] = useState(null); // Track which rate is being edited
  const rateInputRefs = useRef({}); // Refs for rate inputs

  /* ─────────── load users & roles once ─────────── */
  useEffect(() => {
    (async () => {
      /* user list */
      const snap = await getDocs(collection(db, "user"));
      console.log("user list", snap.docs);
      setUserOptions(
        snap.docs.map((d) => ({
          label: `${d.data().first_name} ${d.data().last_name}`,
          value: d.id,
          icon: () => <Ionicons name="person-outline" size={18} color="#888" />,
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
      backgroundColor: ok ? "#555" : "#f44336",
      textColor: "#fff",
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
    });

  const addSelectedEmployees = async () => {
    if (!selectedEmployees.length) return;
    setWorking(true);

    try {
      // Add each selected employee
      for (const uid of selectedEmployees) {
        await updateDoc(doc(db, "businesses", business.business_id), {
          employees: arrayUnion(uid),
        });
      }

      toast(`${selectedEmployees.length} employee(s) added`);
      setSelectedEmployees([]);
    } catch (error) {
      toast("Error adding employees", false);
      console.error(error);
    }

    setWorking(false);
  };

  const removeEmployee = (uid) =>
    Alert.alert(
      "Remove Employee",
      "Are you sure you want to remove this employee?",
      [
        { text: "Cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setWorking(true);
            await updateDoc(doc(db, "businesses", business.business_id), {
              employees: arrayRemove(uid),
            });
            toast("Employee removed");
            setWorking(false);
          },
        },
      ]
    );

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

  const handleRateChange = (uid, value) => {
    setRoleMap((r) => ({ ...r, [uid + "_rate"]: value }));
  };

  const handleRateBlur = async (uid) => {
    setEditingRate(null);
    const rStr = roleMap[uid + "_rate"] || "0";
    const rate = parseFloat(rStr);

    if (isNaN(rate)) {
      toast("Please enter a valid number", false);
      return;
    }

    setWorking(true);
    await setDoc(
      doc(db, "businesses", business.business_id, "roles", uid),
      { hourly_rate: rate },
      { merge: true }
    );
    toast("Rate saved");
    setWorking(false);
  };

  const focusRateInput = (uid) => {
    setEditingRate(uid);
    if (rateInputRefs.current[uid]) {
      rateInputRefs.current[uid].focus();
    }
  };

  /* prepare data */
  const current = userOptions.filter((u) =>
    (business.employees || []).includes(u.value)
  );

  const selectedEmployeeItems = selectedEmployees
    .map((uid) => userOptions.find((u) => u.value === uid))
    .filter(Boolean);

  /* Employee card component */
  const EmployeeCard = ({ item }) => {
    const uid = item.value;
    const role = roleMap[uid] || "staff";
    const next = role === "manager" ? "staff" : "manager";
    const isEditing = editingRate === uid;

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.userInfo}>
            <Ionicons name="person" size={20} color="#555" />
            <Text style={s.userName}>{item.label}</Text>
          </View>

          <TouchableOpacity
            style={[s.roleBtn, role === "manager" ? s.managerBtn : s.staffBtn]}
            onPress={() => saveRole(uid, next)}
          >
            <Text style={s.roleBtnTxt}>{role}</Text>
            <Ionicons
              name={role === "manager" ? "chevron-down" : "chevron-up"}
              size={14}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <View style={s.cardBody}>
          <View style={s.rateContainer}>
            <Text style={s.rateLabel}>Hourly Rate</Text>
            <TouchableOpacity
              style={[s.rateInputContainer, isEditing && s.rateInputFocused]}
              onPress={() => focusRateInput(uid)}
              activeOpacity={0.7}
            >
              <Text style={s.currencySymbol}>$</Text>
              <TextInput
                ref={(ref) => (rateInputRefs.current[uid] = ref)}
                style={s.rateInput}
                value={roleMap[uid + "_rate"] || ""}
                onChangeText={(t) => handleRateChange(uid, t)}
                onBlur={() => handleRateBlur(uid)}
                keyboardType="numeric"
                placeholder="0.00"
                selectTextOnFocus={true}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.removeBtn}
            onPress={() => removeEmployee(uid)}
          >
            <Ionicons name="trash-outline" size={16} color="#888" />
            <Text style={s.removeTxt}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* Selected employee chip */
  const EmployeeChip = ({ item, onRemove }) => (
    <View style={s.chip}>
      <Text style={s.chipText} numberOfLines={1}>
        {item.label}
      </Text>
      <TouchableOpacity onPress={onRemove} style={s.chipRemove}>
        <Ionicons name="close" size={16} color="#888" />
      </TouchableOpacity>
    </View>
  );

  /* render */
  return (
    <View style={s.container}>
      <Text style={s.title}>Employees</Text>

      <View style={s.addSection}>
        <Text style={s.sectionLabel}>Add New Employees</Text>

        {/* Selected employees chips */}
        {selectedEmployees.length > 0 && (
          <ScrollView
            horizontal={true}
            style={s.chipsScrollView}
            contentContainerStyle={s.chipsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {selectedEmployeeItems.map((item) => (
              <EmployeeChip
                key={item.value}
                item={item}
                onRemove={() =>
                  setSelectedEmployees((prev) =>
                    prev.filter((uid) => uid !== item.value)
                  )
                }
              />
            ))}
          </ScrollView>
        )}

        {/* Dropdown for selecting employees */}
        <DropDownPicker
          listMode="SCROLLVIEW"
          open={open}
          multiple={true}
          value={selectedEmployees}
          items={userOptions.filter(
            (u) => !(business.employees || []).includes(u.value)
          )}
          setOpen={setOpen}
          setValue={setSelectedEmployees}
          setItems={setUserOptions}
          placeholder="Select employees to add"
          zIndex={3000}
          zIndexInverse={1000}
          style={s.dropdown}
          dropDownContainerStyle={s.dropdownContainer}
          placeholderStyle={s.dropdownPlaceholder}
          listItemLabelStyle={s.dropdownItemLabel}
          selectedItemLabelStyle={s.dropdownSelectedItem}
          mode="BADGE"
          badgeColors={["#f0f0f0"]}
          badgeTextStyle={{ color: "#333" }}
          searchable={true}
          searchPlaceholder="Search users..."
        />

        {/* Add button */}
        <TouchableOpacity
          disabled={!selectedEmployees.length || working}
          style={[
            s.addBtn,
            (!selectedEmployees.length || working) && s.disabledBtn,
          ]}
          onPress={addSelectedEmployees}
        >
          {working ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.addTxt}>
                Add{" "}
                {selectedEmployees.length > 0
                  ? `${selectedEmployees.length} `
                  : ""}
                Employee{selectedEmployees.length !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Current employees section */}
      <View style={s.currentSection}>
        <Text style={s.sectionLabel}>Current Team Members</Text>
        {current.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="people" size={32} color="#ddd" />
            <Text style={s.emptyText}>No employees added yet</Text>
          </View>
        ) : (
          current.map((item) => <EmployeeCard key={item.value} item={item} />)
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
  },

  // Add section
  addSection: {
    marginBottom: 32,
    backgroundColor: "#fff",
  },
  chipsScrollView: {
    maxHeight: 40,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    paddingRight: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    color: "#333",
    maxWidth: 120,
  },
  chipRemove: {
    marginLeft: 6,
  },
  dropdown: {
    borderColor: "#eee",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  dropdownContainer: {
    borderColor: "#eee",
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownPlaceholder: {
    color: "#999",
    fontSize: 15,
  },
  dropdownItemLabel: {
    color: "#333",
    fontSize: 15,
  },
  dropdownSelectedItem: {
    color: "#333",
    fontWeight: "500",
  },
  addBtn: {
    backgroundColor: "#FF8008",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  addTxt: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 15,
    marginLeft: 8,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: "#ccc",
  },

  // Current employees section
  currentSection: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Employee card styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  roleBtn: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  managerBtn: {
    backgroundColor: "#FF8008",
  },
  staffBtn: {
    backgroundColor: "#999",
  },
  roleBtnTxt: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginRight: 4,
  },

  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  rateContainer: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 6,
  },
  rateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  rateInputFocused: {
    borderColor: "#FF8008",
    backgroundColor: "#fff",
  },
  currencySymbol: {
    fontSize: 15,
    color: "#777",
    marginRight: 4,
  },
  rateInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
  },
  removeTxt: {
    fontSize: 13,
    color: "#777",
    marginLeft: 4,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#777",
    marginTop: 12,
  },
});
