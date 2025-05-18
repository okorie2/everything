"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  SectionList,
} from "react-native"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { auth, db, storage } from "../../../backend/firebase"
import { signOut } from "firebase/auth"
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import * as ImagePicker from "expo-image-picker"

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    relationship: "",
    phone_number: "",
    address: "",
    age: "",
    email: "",
    profileImage: null,
  })
  const [ownedBusinesses, setOwnedBusinesses] = useState([])
  const [patientRecords, setPatientRecords] = useState([])
  const [employeeJobs, setEmployeeJobs] = useState([])
  const [activeTab, setActiveTab] = useState("all") // 'all', 'owned', 'employee'
  const [sections, setSections] = useState([])

  // Prepare sections data for SectionList
  useEffect(() => {
    const profileSection = {
      title: "profile",
      data: [{ type: "profile" }],
    }

    const editFormSection = editing
      ? {
          title: "editForm",
          data: [{ type: "editForm" }],
        }
      : null

    const jobsSection = {
      title: "jobs",
      data: [{ type: "jobs" }],
    }

    const recordsSection = {
      title: "records",
      data: [{ type: "records" }],
    }

    const sectionsData = [profileSection]
    if (editFormSection) sectionsData.push(editFormSection)
    sectionsData.push(jobsSection, recordsSection)

    setSections(sectionsData)
  }, [editing, ownedBusinesses, employeeJobs, patientRecords])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchUserData()
    await fetchUserHealthRecords()
    setRefreshing(false)
  }

  const EmptyRecordsComponent = () => (
    <View style={styles.emptyRecordsContainer}>
      <MaterialIcons name="medical-services" size={40} color={"#999999"} />
      <Text style={styles.emptyRecordsText}>No health records found</Text>
    </View>
  )

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        navigation.replace("Login")
        return
      }

      // Get user profile data from Firestore
      const userDocRef = doc(db, "user", currentUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data()

        setUserData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          relationship: data.relationship || "",
          phone_number: data.phone_number ? data.phone_number.toString() : "",
          address: data.address || "",
          email: data.email || "",
          profileImage: data.profileImage || null,
        })
      } else {
        // Initialize with just email if no profile exists yet
        setUserData((prev) => ({
          ...prev,
          email: currentUser.email || "",
        }))
      }

      // Fetch businesses owned by user
      const ownedQuery = query(collection(db, "businesses"), where("owner_id", "==", currentUser.uid))
      const ownedSnapshot = await getDocs(ownedQuery)
      const ownedList = ownedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: "owned",
      }))
      setOwnedBusinesses(ownedList)

      // Fetch jobs where user is an employee
      const employeeQuery = query(collection(db, "businesses"), where("employees", "array-contains", currentUser.uid))
      const employeeSnapshot = await getDocs(employeeQuery)

      // Get the business details for each employee job
      const employeeJobs = []
      for (const empDoc of employeeSnapshot.docs) {
        const empData = empDoc.data()
        console.log(empData, "Employee Jobs")

        if (empData.business_id) {
          const businessDoc = await getDoc(doc(db, "businesses", empData.business_id))
          if (businessDoc.exists()) {
            employeeJobs.push({
              id: empDoc.id,
              ...empData,
              ...businessDoc.data(),
              type: "employee",
            })
          }
        }
      }

      setEmployeeJobs(employeeJobs)
    } catch (error) {
      console.log("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserHealthRecords = async () => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return
    }

    try {
      // Assuming you have a business object or ID available
      // If not, you'll need to adjust this query
      const business = { business_id: "bethel-hospital" } // Replace with actual business ID or object

      const recordsRef = collection(db, "businesses", business.business_id, "clinics", "General", "records")
      const q = query(recordsRef, where("patientid", "==", currentUser.uid))

      const snapshot = await getDocs(q)

      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setPatientRecords(records)
    } catch (err) {
      console.error("Error fetching patient records:", err)
    }
  }

  useEffect(() => {
    fetchUserData()
    fetchUserHealthRecords()
  }, [navigation])

  const navigateToPatientRecord = (record) => {
    navigation.navigate("PatientRecordDetails", { record })
  }

  // Replace the renderPatientRecord function with a more compact version
  const renderPatientRecord = (record) => {
    // Since patientInfo might not be defined, create a fallback
    const patientInfo = {}

    return (
      <TouchableOpacity key={record.id} style={styles.patientCard} onPress={() => navigateToPatientRecord(record)}>
        <View style={styles.patientCardContent}>
          <View style={styles.patientCardLeft}>
            <Text style={styles.patientCondition} numberOfLines={1}>
              {record.condition}
            </Text>
            <Text style={styles.patientName} numberOfLines={1}>
              {userData.firstName || "Patient"} {userData.lastName || ""}
            </Text>
          </View>

          <View style={styles.patientCardRight}>
            <Text style={styles.patientAppointmentDay}>{record.appointmentDay}</Text>
            <View style={styles.timeContainer}>
              <MaterialIcons name="access-time" size={12} color={"#999999"} />
              <Text style={styles.patientAppointmentTime}>{record.appointmentStartTime}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUserData()
    })
    return unsubscribe
  }, [navigation])

  // Request permissions for image library
  useEffect(() => {
    ;(async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to upload images.")
      }
    })()
  }, [])

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const uploadImage = async (uri) => {
    try {
      setUploading(true)
      const currentUser = auth.currentUser
      if (!currentUser) {
        Alert.alert("Error", "User not authenticated")
        return
      }
      const response = await fetch(uri)
      const blob = await response.blob()
      const storageRef = ref(storage, `user_profile_images/${currentUser.uid}`)
      await uploadBytes(storageRef, blob)
      const downloadURL = await getDownloadURL(storageRef)
      // Update user's profile in Firestore
      const userDocRef = doc(db, "user", currentUser.uid)
      await updateDoc(userDocRef, {
        profileImage: downloadURL,
      })

      // Update local state
      setUserData((prev) => ({
        ...prev,
        profileImage: downloadURL,
      }))

      Alert.alert("Success", "Profile picture updated")
    } catch (error) {
      console.error("Error uploading image:", error)
      Alert.alert("Error", error.message || "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      const currentUser = auth.currentUser

      if (!currentUser) {
        Alert.alert("Error", "User not authenticated")
        return
      }

      // Validate data
      if (!userData.firstName || !userData.lastName) {
        Alert.alert("Error", "First name and last name are required")
        setLoading(false)
        return
      }

      // Convert numeric fields
      const formattedData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        relationship: userData.relationship,
        phone_number: userData.phone_number ? Number.parseInt(userData.phone_number, 10) : null,
        address: userData.address,
        email: userData.email,
        profileImage: userData.profileImage,
      }

      // Update user document in Firestore
      const userDocRef = doc(db, "user", currentUser.uid)
      await updateDoc(userDocRef, formattedData)

      setEditing(false)
      Alert.alert("Success", "Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      // navigation.replace("Login");
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Error", "Failed to sign out")
    }
  }

  const getFilteredJobs = () => {
    switch (activeTab) {
      case "owned":
        return ownedBusinesses
      case "employee":
        return employeeJobs
      case "all":
      default:
        return [...ownedBusinesses, ...employeeJobs]
    }
  }

  console.log(getFilteredJobs(), "Filtered Jobs")

  const renderJobCard = ({ item }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() =>
        navigation.navigate("BusinessDetail", {
          business: item,
          initialTab: "contact",
        })
      }
    >
      <View style={styles.jobCardHeader}>
        <Text style={styles.jobCardTitle}>{item.name}</Text>
        <View style={[styles.jobTypeBadge, { backgroundColor: item.type === "owned" ? "#FF8C00" : "#4CAF50" }]}>
          <Text style={styles.jobTypeBadgeText}>{item.type === "owned" ? "Owner" : "Employee"}</Text>
        </View>
      </View>

      <View style={styles.jobCardContent}>
        {item.company && (
          <View style={styles.jobCardRow}>
            <Ionicons name="business-outline" size={16} color="#666" />
            <Text style={styles.jobCardText}>{item.company}</Text>
          </View>
        )}

        {item.category && (
          <View style={styles.jobCardRow}>
            <Ionicons name="pricetag-outline" size={16} color="#666" />
            <Text style={styles.jobCardText}>{item.category}</Text>
          </View>
        )}

        {item.job_category && (
          <View style={styles.jobCardRow}>
            <Ionicons name="briefcase-outline" size={16} color="#666" />
            <Text style={styles.jobCardText}>{item.job_category}</Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.jobCardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  )

  // Render profile section
  const renderProfileSection = () => (
    <View style={styles.profileCard}>
      <View style={styles.profileCardContent}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          {uploading ? (
            <View style={styles.profileImagePlaceholder}>
              <ActivityIndicator size="large" color="#FF8C00" />
            </View>
          ) : userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={uploading}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {userData.firstName} {userData.lastName}
          </Text>
          <Text style={styles.profileEmail}>{userData.email}</Text>
          {userData.phone_number && (
            <Text style={styles.profileDetail}>
              <Ionicons name="call-outline" size={14} color="#666" /> {userData.phone_number}
            </Text>
          )}
          {userData.relationship && (
            <Text style={styles.profileDetail}>
              <Ionicons name="heart-outline" size={14} color="#666" /> {userData.relationship}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditing(!editing)}>
        <Ionicons name={editing ? "save-outline" : "create-outline"} size={16} color="white" />
        <Text style={styles.editProfileButtonText}>{editing ? "Save Profile" : "Edit Profile"}</Text>
      </TouchableOpacity>
    </View>
  )

  // Render edit form section
  const renderEditFormSection = () => (
    <View style={styles.editFormCard}>
      <Text style={styles.sectionTitle}>Edit Profile</Text>

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={userData.firstName}
            onChangeText={(text) => setUserData({ ...userData, firstName: text })}
            placeholder="Enter first name"
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={userData.lastName}
            onChangeText={(text) => setUserData({ ...userData, lastName: text })}
            placeholder="Enter last name"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Relationship Status</Text>
        <TextInput
          style={styles.input}
          value={userData.relationship}
          onChangeText={(text) => setUserData({ ...userData, relationship: text })}
          placeholder="Enter relationship status"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={userData.phone_number}
          onChangeText={(text) => setUserData({ ...userData, phone_number: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={userData.address}
          onChangeText={(text) => setUserData({ ...userData, address: text })}
          placeholder="Enter address"
          multiline
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  )

  // Render jobs section
  const renderJobsSection = () => (
    <View style={styles.jobsSection}>
      <Text style={styles.sectionTitle}>My Jobs & Businesses</Text>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, activeTab === "all" && styles.activeFilterTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.filterTabText, activeTab === "all" && styles.activeFilterTabText]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === "owned" && styles.activeFilterTab]}
          onPress={() => setActiveTab("owned")}
        >
          <Text style={[styles.filterTabText, activeTab === "owned" && styles.activeFilterTabText]}>Owned</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{ownedBusinesses.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === "employee" && styles.activeFilterTab]}
          onPress={() => setActiveTab("employee")}
        >
          <Text style={[styles.filterTabText, activeTab === "employee" && styles.activeFilterTabText]}>Jobs</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{employeeJobs.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      {getFilteredJobs().length > 0 ? (
        <FlatList
          data={getFilteredJobs()}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.jobsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>
            {activeTab === "all"
              ? "No jobs or businesses found"
              : activeTab === "owned"
                ? "You don't own any businesses yet"
                : "You're not employed anywhere yet"}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("BusinessList")}>
            <Text style={styles.addButtonText}>{activeTab === "employee" ? "Find Jobs" : "Add Business"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  // Render records section
  const renderRecordsSection = () => (
    <View style={styles.recordsSection}>
      <Text style={styles.sectionTitle}>My Health Records</Text>
      {patientRecords.length > 0 ? (
        patientRecords.map((record) => renderPatientRecord(record))
      ) : (
        <EmptyRecordsComponent />
      )}
    </View>
  )

  // Render section item
  const renderSectionItem = ({ item }) => {
    switch (item.type) {
      case "profile":
        return renderProfileSection()
      case "editForm":
        return renderEditFormSection()
      case "jobs":
        return renderJobsSection()
      case "records":
        return renderRecordsSection()
      default:
        return null
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.type + index}
        renderItem={renderSectionItem}
        renderSectionHeader={() => null}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF8C00"]} />}
      />
    </KeyboardAvoidingView>
  )
}

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
    height: 80,
    backgroundColor: "#FF8C00",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    flexDirection: "row",
    // paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
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
    padding: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#FF8C00",
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF8C00",
  },
  uploadButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF8C00",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  editProfileButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  editProfileButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },

  // Edit Form
  editFormCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  formColumn: {
    flex: 1,
    marginRight: 8,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#FF8C00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Jobs Section
  jobsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  activeFilterTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeFilterTabText: {
    color: "#FF8C00",
    fontWeight: "600",
  },
  badgeCount: {
    backgroundColor: "#FF8C00",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  badgeCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  jobsList: {
    paddingBottom: 8,
  },
  jobCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jobCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  jobTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jobTypeBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  jobCardContent: {
    marginBottom: 12,
  },
  jobCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  jobCardText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  jobCardDescription: {
    fontSize: 14,
    color: "#444",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
  },
  addButton: {
    backgroundColor: "#FF8C00",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },

  // Records Section
  recordsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: "#1a2a6c",
  },
  patientCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  patientCardRight: {
    alignItems: "flex-end",
  },
  patientCondition: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 2,
  },
  patientName: {
    fontSize: 12,
    color: "#666666",
  },
  patientAppointmentDay: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666666",
    marginBottom: 2,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientAppointmentTime: {
    fontSize: 10,
    color: "#999999",
    marginLeft: 2,
  },
  emptyRecordsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginTop: 10,
  },
  emptyRecordsText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 10,
  },
})

export default ProfileScreen
