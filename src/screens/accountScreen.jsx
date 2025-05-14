import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../backend/firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, storage } from "../../backend/firebase"; // Import storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import storage functions
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker

const { height } = Dimensions.get("window");

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    relationship: "",
    phone_number: "",
    address: "",
    age: "",
    email: "",
    profileImage: null,
  });
  const [jobs, setJobs] = useState([]);

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigation.replace("Login");
        return;
      }

      // Get user profile data from Firestore
      const userDocRef = doc(db, "user", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();

        setUserData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          relationship: data.relationship || "",
          phone_number: data.phone_number ? data.phone_number.toString() : "",
          address: data.address || "",
          email: data.email || "",
          profileImage: data.profileImage || null,
        });
      } else {
        // Initialize with just email if no profile exists yet
        setUserData((prev) => ({
          ...prev,
          email: currentUser.email || "",
        }));
      }

      // Fetch user's jobs
      const jobsQuery = query(
        collection(db, "jobs"),
        where("userId", "==", currentUser.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsList = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobsList);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Fetch user data when the screen is focused
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);

  // Request permissions for image library
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to upload images."
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "User not authenticated");
        return;
      }
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `user_profile_images/${currentUser.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      // Update user's profile in Firestore
      const userDocRef = doc(db, "user", currentUser.uid);
      await updateDoc(userDocRef, {
        profileImage: downloadURL,
      });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        profileImage: downloadURL,
      }));

      Alert.alert("Success", "Profile picture updated");
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Validate data
      if (!userData.firstName || !userData.lastName) {
        Alert.alert("Error", "First name and last name are required");
        setLoading(false);
        return;
      }

      // Convert numeric fields
      const formattedData = {
        ...userData,
        age: userData.age ? parseInt(userData.age, 10) : null,
        phone_number: userData.phone_number
          ? parseInt(userData.phone_number, 10)
          : null,
      };

      // Update user document in Firestore
      const userDocRef = doc(db, "user", currentUser.uid);
      await updateDoc(userDocRef, formattedData);

      setEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // navigation.replace("Login");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {/* Profile Image Section */}
        <View style={styles.profileImageContainer}>
          {uploading ? (
            <View style={styles.profileImagePlaceholder}>
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          ) : userData.profileImage ? (
            <Image
              source={{ uri: userData.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={80} color="#ccc" />
            </View>
          )}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.uploadButtonText}>
              {userData.profileImage ? "Change Photo" : "Add Photo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={24} color="#FF8C00" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSaveProfile}>
                <Ionicons name="save-outline" size={24} color="#FF8C00" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.disabledInput]}
              value={userData.firstName}
              onChangeText={(text) =>
                setUserData({ ...userData, firstName: text })
              }
              editable={editing}
              placeholder="Enter first name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.disabledInput]}
              value={userData.lastName}
              onChangeText={(text) =>
                setUserData({ ...userData, lastName: text })
              }
              editable={editing}
              placeholder="Enter last name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Relationship Status</Text>
            <TextInput
              style={[styles.input, !editing && styles.disabledInput]}
              value={userData.relationship}
              onChangeText={(text) =>
                setUserData({ ...userData, relationship: text })
              }
              editable={editing}
              placeholder="Enter relationship status"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !editing && styles.disabledInput]}
              value={userData.phone_number}
              onChangeText={(text) =>
                setUserData({ ...userData, phone_number: text })
              }
              editable={editing}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, !editing && styles.disabledInput]}
              value={userData.address}
              onChangeText={(text) =>
                setUserData({ ...userData, address: text })
              }
              editable={editing}
              placeholder="Enter address"
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={userData.email}
              editable={false}
              placeholder="Email address"
            />
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Jobs</Text>
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <View key={job.id} style={styles.card}>
                <Text style={styles.cardTitle}>{job.title}</Text>
                <Text style={styles.cardSubtitle}>{job.company}</Text>
                <Text>{job.description}</Text>
                <Text style={styles.cardDate}>
                  Started: {formatDate(job.startDate)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>No jobs added yet</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    height: height * 0.15,
    backgroundColor: "#FF8C00",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: height * 0.05,
    paddingHorizontal: 20,
    flexDirection: "row",
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    marginLeft: 5,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  // Profile Image Styles
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#FF8C00",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#FF8C00",
  },
  uploadButton: {
    backgroundColor: "#FF8C00",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "500",
  },
  profileSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#FF8C00",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  cardDate: {
    fontSize: 14,
    color: "#FF8C00",
    marginVertical: 5,
  },
  emptyStateText: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
});

export default ProfileScreen;
