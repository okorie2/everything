import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../../backend/firebase"; // Adjust the import path as necessary
import Toast from "react-native-root-toast";

const RegisterBusinessScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    address: "",
    category: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [employees, setEmployees] = useState([]); // Dropdown items
  const [selectedEmployees, setSelectedEmployees] = useState([]); // Selected UIDs
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchUsers = useCallback(async () => {
    const usersSnap = await getDocs(collection(db, "user"));
    const userOptions = usersSnap.docs.map((doc) => ({
      label: `${doc.data().first_name} ${doc.data().last_name}`,
      value: doc.id,
    }));
    setEmployees(userOptions);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRegister = async () => {
    const newErrors = {};
    const { name, address, category, description, contactEmail, contactPhone } =
      form;

    if (!name) newErrors.name = "Business name is required";
    if (!address) newErrors.address = "Address is required";
    if (!category) newErrors.category = "Category is required";
    if (!description) newErrors.description = "Description is required";
    if (!contactEmail) newErrors.contactEmail = "Email is required";
    if (!contactPhone) newErrors.contactPhone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Toast.show("You must be logged in to register a business", {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: "#1a2a6c",
        textColor: "#fff",
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const businessData = {
        ...form,
        owner_id: user.uid,
        employees: selectedEmployees,
        contact_info: {
          email: contactEmail,
          phone: contactPhone,
        },
        created_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "businesses"), businessData);
      await setDoc(
        doc(db, "businesses", docRef.id),
        { business_id: docRef.id },
        { merge: true }
      );

      Toast.show("Business registered successfully", {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: "#1a2a6c",
        textColor: "#fff",
      });

      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show("Something went wrong", {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        backgroundColor: "#b21f1f",
        textColor: "#fff",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.title}>Register a Business</Text>

        <TextInput
          style={styles.input}
          placeholder="Business Name"
          value={form.name}
          onChangeText={(text) => handleInputChange("name", text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Business Address"
          value={form.address}
          onChangeText={(text) => handleInputChange("address", text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Category"
          value={form.category}
          onChangeText={(text) => handleInputChange("category", text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Contact Email"
          keyboardType="email-address"
          value={form.contactEmail}
          onChangeText={(text) => handleInputChange("contactEmail", text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Contact Phone"
          keyboardType="phone-pad"
          value={form.contactPhone}
          onChangeText={(text) => handleInputChange("contactPhone", text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief Description"
          multiline
          numberOfLines={4}
          value={form.description}
          onChangeText={(text) => handleInputChange("description", text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <Text style={styles.label}>Add Employees</Text>
        <DropDownPicker
          open={employeeDropdownOpen}
          value={selectedEmployees}
          items={employees}
          setOpen={setEmployeeDropdownOpen}
          setValue={setSelectedEmployees}
          setItems={setEmployees}
          multiple={true}
          placeholder="Select employees"
          mode="BADGE"
          style={styles.dropdown}
          badgeColors={["#1a2a6c"]}
          dropDownContainerStyle={{ borderColor: "#ccc" }}
          //   badge text color
          badgeTextStyle={{ color: "#fff" }}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TouchableOpacity
          style={[styles.button, isSubmitting && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Creating..." : "Submit"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterBusinessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  form: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    color: "#1a2a6c",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    marginTop: 20,
    marginBottom: 10,
    color: "#1a2a6c",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dropdown: {
    borderRadius: 10,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF8008",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  errorText: {
    color: "#b21f1f",
    fontSize: 13,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
});
