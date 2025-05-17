import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { db } from "../../../backend/firebase";
import Toast from "react-native-root-toast";
import { Ionicons } from "@expo/vector-icons"; // Make sure to install expo/vector-icons
import { getBusinessCategories } from "../../util/getBusinessCategories";
import CustomDropdown from "./components/Dropdown";

const RegisterBusinessScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    address: "",
    category: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleCategoryChange = (item) => {
    console.log("Selected category:", item);
    setForm({
      ...form,
      category: item,
    });

    // Clear error when selecting
    if (errors.category) {
      setErrors({
        ...errors,
        category: null,
      });
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const usersSnap = await getDocs(collection(db, "user"));
      const userOptions = usersSnap.docs.map((doc) => ({
        label: `${doc.data().first_name} ${doc.data().last_name}`,
        value: doc.id,
        icon: () => (
          <Text>
            <Ionicons name="person-outline" size={18} color="#666" />
          </Text>
        ),
      }));
      console.log("Fetched users:", userOptions);
      setEmployees(userOptions);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      Toast.show("Could not load employee list", {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: "#f44336",
        textColor: "#fff",
      });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    async function fetchCategories() {
      const cat = await getBusinessCategories();
      setCategories(cat);
    }
    fetchCategories();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const { name, address, category, description, contactEmail, contactPhone } =
      form;

    if (!name.trim()) newErrors.name = "Business name is required";
    if (!address.trim()) newErrors.address = "Address is required";
    if (!category.trim()) newErrors.category = "Category is required";
    if (!description.trim()) newErrors.description = "Description is required";

    if (!contactEmail.trim()) {
      newErrors.contactEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email";
    }

    if (!contactPhone.trim()) {
      newErrors.contactPhone = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(contactPhone.replace(/[^0-9]/g, ""))) {
      newErrors.contactPhone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Toast.show("You must be logged in to register a business", {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: "#f44336",
        textColor: "#fff",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const businessData = {
        ...form,
        owner_id: user.uid,
        employees: selectedEmployees,
        contact_info: {
          email: form.contactEmail,
          phone: form.contactPhone,
        },
        status: "pending_approval", // <-- ADDED
        created_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "businesses"), businessData);

      // Back-write the auto-ID for convenience
      await setDoc(
        doc(db, "businesses", docRef.id),
        { business_id: docRef.id },
        { merge: true }
      );

      Alert.alert(
        "Success",
        "Business registered and awaiting admin approval!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );

      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show("Registration failed. Please try again.", {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        backgroundColor: "#f44336",
        textColor: "#fff",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderInputField = (
    placeholder,
    key,
    keyboardType = "default",
    iconName = null,
    multiline = false,
    numberOfLines = 1
  ) => {
    const isFocused = focusedField === key;
    const hasError = errors[key];

    return (
      <View style={styles.inputContainer}>
        {iconName && (
          <Text style={styles.inputIcon}>
            <Ionicons
              name={iconName}
              size={20}
              color={isFocused ? "#FF8008" : hasError ? "#f44336" : "#999"}
            />
          </Text>
        )}
        <TextInput
          style={[
            styles.input,
            multiline && styles.textArea,
            isFocused && styles.inputFocused,
            hasError && styles.inputError,
          ]}
          placeholder={placeholder}
          value={form[key]}
          onChangeText={(text) => handleInputChange(key, text)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
          placeholderTextColor="#999"
        />
        {hasError && <Text style={styles.errorText}>{errors[key]}</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text>
              <Ionicons name="chevron-back" size={24} color="#1a2a6c" />
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Register Business</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Business Information</Text>
              {renderInputField(
                "Business Name",
                "name",
                "default",
                "business-outline"
              )}
              {renderInputField(
                "Business Address",
                "address",
                "default",
                "location-outline"
              )}
              <CustomDropdown
                placeholder="Select Category"
                options={categories}
                value={form.category}
                onChange={handleCategoryChange}
                iconName="list-outline"
                error={errors.category}
                fieldKey="category"
                setFocusedField={setFocusedField}
              />
              {renderInputField(
                "Business Description",
                "description",
                "default",
                "create-outline",
                true,
                4
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              {renderInputField(
                "Contact Email",
                "contactEmail",
                "email-address",
                "mail-outline"
              )}
              {renderInputField(
                "Contact Phone",
                "contactPhone",
                "phone-pad",
                "call-outline"
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Team</Text>
              <Text style={styles.dropdownLabel}>Add Employees</Text>

              <DropDownPicker
                open={employeeDropdownOpen}
                value={selectedEmployees}
                items={employees}
                setOpen={setEmployeeDropdownOpen}
                setValue={setSelectedEmployees}
                setItems={setEmployees}
                multiple={true}
                placeholder="Select employees"
                placeholderStyle={{ color: "#999" }}
                mode="BADGE"
                style={styles.dropdown}
                badgeColors={["#1a2a6c"]}
                badgeDotColors={["#FF8008"]}
                badgeTextStyle={{ color: "#fff" }}
                dropDownContainerStyle={styles.dropdownContainer}
                listItemLabelStyle={styles.dropdownItemLabel}
                selectedItemContainerStyle={styles.selectedItemContainer}
                selectedItemLabelStyle={styles.selectedItemLabel}
                listMode="SCROLLVIEW"
                searchable={true}
                searchPlaceholder="Search employees..."
                closeOnBackPressed={true}
                itemSeparator={true}
                itemSeparatorStyle={styles.itemSeparator}
                zIndex={3000}
                zIndexInverse={1000}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                </Text>
                <Text style={styles.buttonText}>Register Business</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default RegisterBusinessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a2a6c",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a2a6c",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingLeft: 40,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  inputFocused: {
    borderColor: "#FF8008",
    backgroundColor: "#FFFFFF",
    shadowColor: "#FF8008",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: "#f44336",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  dropdown: {
    borderRadius: 10,
    borderColor: "#E0E7FF",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 2000,
  },
  dropdownContainer: {
    borderColor: "#E0E7FF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownItemLabel: {
    color: "#333",
  },
  selectedItemContainer: {
    backgroundColor: "#F0F8FF",
  },
  selectedItemLabel: {
    color: "#1a2a6c",
    fontWeight: "500",
  },
  itemSeparator: {
    backgroundColor: "#F5F7FA",
    height: 1,
  },
  button: {
    backgroundColor: "#FF8008",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#FF8008",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#FFBC80",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
});
