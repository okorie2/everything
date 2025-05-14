import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../../../backend/firebase"; // Adjust the import path as necessary
import DateTimePicker from "@react-native-community/datetimepicker";
import { useValidateForm } from "../../hooks/useValidateForm"; // Assuming you have a validation function
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
} from "firebase/auth";

const RegistrationScreen = ({ navigation }) => {
  const [formDetails, setFormDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
    birthDate: new Date(),
    relationship: "single",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedValue, setSelectedValue] = useState("single");

  const auth = getAuth();

  const onValueChange = (itemValue) => {
    setSelectedValue(itemValue);
    updateFormField("relationship", itemValue);
  };

  const options = [
    { label: "Single", value: "single" },
    { label: "Married", value: "married" },
  ];

  // Update form field
  const updateFormField = (field, value) => {
    setFormDetails((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  // Date picker handlers
  const onChangeBirthDate = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    const currentDate = selectedDate || formDetails.birthDate;
    setShowDatePicker(Platform.OS === "ios");
    updateFormField("birthDate", currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const { validateForm } = useValidateForm(formDetails, setErrors);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const isValid = validateForm();
      if (!isValid || secureConfirmTextEntry !== secureTextEntry) {
        setLoading(false);
        Alert.alert("Please fill all fields correctly");
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formDetails.email,
        formDetails.password
      );
      await setDoc(doc(db, "user", userCredential.user.uid), {
        first_name: formDetails.firstName,
        last_name: formDetails.lastName,
        email: formDetails.email,
        phone_number: formDetails.phoneNumber,
        address: formDetails.address,
        birth_date: formDetails.birthDate,
        relationship: formDetails.relationship,
      });
      setLoading(false);
      navigation.navigate("EmailVerification");
      await sendEmailVerification(userCredential.user);
      Alert.alert("Registration successful! Please verify your email.");
    } catch (error) {
      setLoading(false);

      Alert.alert("Registration failed." + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            {/* Logo placeholder */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>B</Text>
              </View>
              <Text style={styles.appName}>BETHEL CITY</Text>
            </View>
            <Text style={styles.headerTitle}>Create Your Account</Text>
            <Text style={styles.headerSubtitle}>
              Join Bethel's unified digital platform for city services
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Personal Information */}
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputContainer}>
              <Icon
                name="account"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="First name"
                value={formDetails.firstName}
                onChangeText={(text) => updateFormField("firstName", text)}
                autoComplete="given-name"
                textContentType="givenName"
              />
            </View>
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}

            <View style={styles.inputContainer}>
              <Icon
                name="account"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Last name"
                value={formDetails.lastName}
                onChangeText={(text) => updateFormField("lastName", text)}
                autoComplete="family-name"
                textContentType="familyName"
              />
            </View>
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}

            <View style={styles.inputContainer}>
              <Icon
                name="email"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formDetails.email}
                onChangeText={(text) => updateFormField("email", text)}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <View style={styles.inputContainer}>
              <Icon
                name="phone"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={formDetails.phoneNumber}
                onChangeText={(text) => updateFormField("phoneNumber", text)}
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}

            <View style={styles.inputContainer}>
              <Icon
                name="map-marker"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={formDetails.address}
                onChangeText={(text) => updateFormField("address", text)}
                autoComplete="street-address"
                textContentType="fullStreetAddress"
              />
            </View>
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}

            {/* birthday input */}
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={showDatepicker}
              activeOpacity={0.7}
            >
              <Icon
                name="calendar"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <Text style={styles.dateText}>
                {formDetails.birthDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {errors.birthDate && (
              <Text style={styles.errorText}>{errors.birthDate}</Text>
            )}

            {/* Date Picker Modal */}
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={formDetails.birthDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeBirthDate}
                maximumDate={new Date()}
              />
            )}

            {/* relationship dropdown */}
            <View style={styles.inputContainer}>
              <Icon
                name="heart"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <View style={styles.radioContainer}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioOption}
                    onPress={() => onValueChange(option.value)}
                  >
                    <View style={styles.radioButton}>
                      {selectedValue === option.value && (
                        <View style={styles.selectedRadio} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {errors.relationship && (
              <Text style={styles.errorText}>{errors.relationship}</Text>
            )}

            {/* Password Section */}
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.inputContainer}>
              <Icon
                name="lock"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={secureTextEntry}
                value={formDetails.password}
                onChangeText={(text) => updateFormField("password", text)}
              />
              <TouchableOpacity
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              >
                <Icon
                  name={secureTextEntry ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <View style={styles.inputContainer}>
              <Icon
                name="lock-check"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry={secureConfirmTextEntry}
                value={formDetails.confirmPassword}
                onChangeText={(text) =>
                  updateFormField("confirmPassword", text)
                }
              />
              <TouchableOpacity
                onPress={() =>
                  setSecureConfirmTextEntry(!secureConfirmTextEntry)
                }
              >
                <Icon
                  name={secureConfirmTextEntry ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            {/* Terms and Privacy Policy */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By registering, you agree to our{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Already have account link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{" "}
                <Text style={styles.loginLinkTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#FF8008",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1a2a6c",
  },
  appName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 2,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  headerSubtitle: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    height: 50, // Fixed height for consistency
  },
  radioContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  selectedRadio: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#666",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  picker: {
    flex: 1,
    height: 50,
    color: "#333",
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  errorText: {
    color: "#b21f1f",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 10,
  },
  termsContainer: {
    marginVertical: 20,
  },
  termsText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: "#1a2a6c",
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: "#1a2a6c",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#666",
    fontSize: 16,
  },
  loginLinkTextBold: {
    fontWeight: "bold",
    color: "#1a2a6c",
  },
});

export default RegistrationScreen;
