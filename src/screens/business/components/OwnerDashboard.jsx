import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../../../backend/firebase"; // Adjust the import path as necessary
import DropDownPicker from "react-native-dropdown-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ManageEmployees from "./ManageEmployees";
import PayrollTab from "./PayrollTab";
import SnapshotCards from "./SnapshotCards"; // Adjust the import path as necessary
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { COLORS } from "./EmployeeDashboard";
import { useNavigation } from "@react-navigation/native";

const OwnerDashboard = ({ business, currentUser, activeTab }) => {
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: new Date(),
  });
  const navigation = useNavigation()

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState({});
  const [staffInfo, setStaffInfo] = useState({});
  const [patientRecords, setPatientRecords] = useState([]);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [employeeItems, setEmployeeItems] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const priorityItems = [
    { label: "High Priority", value: "high" },
    { label: "Medium Priority", value: "medium" },
    { label: "Low Priority", value: "low" },
  ];

  // Fetch employees from user collection
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeDocs = await Promise.all(
          (business.employees || []).map(async (uid) => {
            const userDoc = await getDocs(
              query(collection(db, "user"), where("__name__", "==", uid))
            );

            const docSnap = userDoc.docs[0];
            if (!docSnap) return {}; // Failsafe: skip if user not found
            const data = docSnap.data();
            return {
              label: `${data.first_name} ${data.last_name}`,
              value: uid,
              avatar: data.profile_photo || null,
            };
          })
        );
        setEmployeeItems(employeeDocs);
      } catch (error) {
        console.error("Error fetching employees:", error);
        Alert.alert("Error", "Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [business]);


  // Fetch all tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const taskRef = collection(
          db,
          "businesses",
          business.business_id,
          "tasks"
        );
        const taskQuery = query(taskRef, orderBy("created_at", "desc"));
        const snapshot = await getDocs(taskQuery);
        const allTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          created_at:
            doc.data().created_at?.toDate().toLocaleDateString() ||
            "Unknown date",
          assignee_name: getEmployeeName(doc.data().assigned_to),
        }));
        setTasks(allTasks);
        setFilteredTasks(allTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        Alert.alert("Error", "Failed to load tasks");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchTasks();
  }, [business, refreshing, employeeItems]);

  // Filter tasks when taskFilter changes
  useEffect(() => {
    if (taskFilter === "all") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === taskFilter));
    }
  }, [taskFilter, tasks]);

  const getEmployeeName = (uid) => {
    const employee = employeeItems.find((emp) => emp.value === uid);
    return employee ? employee.label : "Unknown Employee";
  };

  const handleCreateTask = async () => {
    const { title, description, priority, due_date } = taskForm;
    if (!title || !description || selectedEmployees.length === 0) {
      Alert.alert("Error", "All task fields are required.");
      return;
    }

    setLoading(true);
    try {
      const taskRef = collection(
        db,
        "businesses",
        business.business_id,
        "tasks"
      );

      const batch = selectedEmployees.map((uid) =>
        addDoc(taskRef, {
          title,
          description,
          assigned_to: uid,
          priority,
          due_date: due_date,
          status: "pending",
          created_at: serverTimestamp(),
          completed_at: null,
        })
      );

      await Promise.all(batch);

      // Log this activity
      const activityRef = collection(
        db,
        "businesses",
        business.business_id,
        "activity"
      );
      await addDoc(activityRef, {
        type: "task_created",
        message: `New task "${title}" assigned to ${selectedEmployees.length} employees`,
        timestamp: serverTimestamp(),
      });

      Alert.alert("Success", "Tasks created for selected employees!");
      setTaskForm({
        title: "",
        description: "",
        priority: "medium",
        due_date: new Date(),
      });
      setSelectedEmployees([]);
      setRefreshing(true);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to create tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setLoading(true);
    try {
      const taskDoc = doc(
        db,
        "businesses",
        business.business_id,
        "tasks",
        taskId
      );

      const taskSnapshot = await getDocs(
        query(
          collection(db, "businesses", business.business_id, "tasks"),
          where("__name__", "==", taskId)
        )
      );

      const taskData = taskSnapshot.docs[0]?.data();

      await updateDoc(taskDoc, {
        status: newStatus,
        updated_at: serverTimestamp(),
      });

      // Log this activity
      const activityRef = collection(
        db,
        "businesses",
        business.business_id,
        "activity"
      );
      await addDoc(activityRef, {
        type: "task_status",
        message: `Task "${taskData.title}" marked as ${newStatus}`,
        timestamp: serverTimestamp(),
      });

      Alert.alert("Success", `Task marked as ${newStatus}`);
      setRefreshing(true);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update task status.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#FF4D4F";
      case "medium":
        return "#FAAD14";
      case "low":
        return "#52C41A";
      default:
        return "#FAAD14";
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "pending":
        return styles.pendingBadge;
      case "completed":
        return styles.completedBadge;
      case "approved":
        return styles.approvedBadge;
      case "rejected":
        return styles.rejectedBadge;
      default:
        return styles.pendingBadge;
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        />
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={getStatusBadgeStyle(item.status)}>
          <Text style={styles.statusBadgeText}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.taskDescription}>{item.description}</Text>

      <View style={styles.taskMetaContainer}>
        <View style={styles.taskMetaItem}>
          <MaterialIcons name="person" size={14} color="#555" />
          <Text style={styles.taskMeta}>{item.assignee_name}</Text>
        </View>

        <View style={styles.taskMetaItem}>
          <MaterialIcons name="date-range" size={14} color="#555" />
          <Text style={styles.taskMeta}>Created: {item.created_at}</Text>
        </View>

        {item.due_date && (
          <View style={styles.taskMetaItem}>
            <MaterialIcons name="event" size={14} color="#555" />
            <Text style={styles.taskMeta}>
              Due: {moment(item.due_date.toDate()).format("DD/MM/YYYY")}
            </Text>
          </View>
        )}
      </View>

      {item.status === "completed" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => handleUpdateTaskStatus(item.id, "approved")}
            style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
          >
            <MaterialIcons name="check-circle" size={16} color="#fff" />
            <Text style={styles.actionText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleUpdateTaskStatus(item.id, "rejected")}
            style={[styles.actionButton, { backgroundColor: "#F44336" }]}
          >
            <MaterialIcons name="cancel" size={16} color="#fff" />
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const fetchPatientInfo = async (patientId) => {
    if (!patientId) return null;

    try {
      const userDoc = doc(db, "user", patientId);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        return userSnapshot.data();
      }
      return null;
    } catch (err) {
      console.error("Error fetching patient info:", err);
      return null;
    }
  };

  const fetchStaffInfo = async (staffId) => {
    if (!staffId) return null;

    try {
      const userDoc = doc(db, "user", staffId);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        return userSnapshot.data();
      }
      return null;
    } catch (err) {
      console.error("Error fetching staff info:", err);
      return null;
    }
  };
  const fetcPatientRecords = async () => {
    try {
      // Assuming you have a business object or ID available
      // If not, you'll need to adjust this query
      const business = { business_id: "bethel-hospital" }; // Replace with actual business ID or object

      const recordsRef = collection(
        db,
        "businesses",
        business.business_id,
        "clinics",
        "General",
        "records"
      );

      const snapshot = await getDocs(recordsRef);

      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(records)

      setPatientRecords(records);

      // Fetch patient info for each record
      const patientInfoMap = {};
      for (const record of records) {
        console.log(record,"rec")
        if (record.patientid) {
          const info = await fetchPatientInfo(record.patientid);
          if (info) {
            patientInfoMap[record.patientid] = info;
          }
        }
      }
      setPatientInfo(patientInfoMap);

      const staffInfoMap = {};
      for (const record of records) {
        if (record.staffId) {
          const info = await fetchStaffInfo(record.staffId);
          if (info) {
            staffInfoMap[record.staffId] = info;
          }
        }
      }
      setStaffInfo(staffInfoMap)

    } catch (err) {
      console.error("Error fetching patient records:", err);
    }
  };

  useEffect(() => {
    fetcPatientRecords();
  }, [navigation]);

  const navigateToPatientRecord = (record) => {
    navigation.navigate("PatientRecordDetails", { record });
  };

  // Replace the renderPatientRecord function with a more compact version
  const renderPatientRecord = (record) => {
    const patient = patientInfo[record.patientid] || {};
    const staff = staffInfo[record.staffId] || {};
    return (
      <TouchableOpacity
        key={record.id}
        style={styles.patientCard}
        onPress={() => navigateToPatientRecord(record)}
      >
        <View style={styles.patientCardContent}>
          <View style={styles.patientCardLeft}>
            <Text style={styles.patientCondition} numberOfLines={1}>
              {record.condition}
            </Text>
            <Text style={styles.patientName} numberOfLines={1}>
              {patient.first_name || "Patient"} {patient.last_name || ""}
            </Text>
          </View>
  
          <View style={styles.patientCardRight}>
            <Text style={styles.patientAppointmentDay}>
              {record.appointmentDay}
            </Text>
            <View style={styles.timeContainer}>
              <MaterialIcons name="access-time" size={12} color={"#999999"} />
              <Text style={styles.patientAppointmentTime}>
                {record.appointmentStartTime}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Staff information section */}
        {staff && (staff.first_name || staff.last_name) && (
          <View style={styles.staffInfoContainer}>
            <View style={styles.staffInfoDivider} />
            <View style={styles.staffInfoContent}>
              <MaterialIcons name="person" size={14} color="#666666" />
              <Text style={styles.staffInfoText}>
                Attended by: {staff.first_name || ""} {staff.last_name || ""}
              </Text>
              {staff.specialization && (
                <View style={styles.specializationBadge}>
                  <Text style={styles.specializationText}>{staff.specialization}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRecordsSection = () => (
    <View style={styles.recordsSection}>
      <Text style={styles.sectionTitle}>All Health Records</Text>
      {patientRecords.length > 0 ? (
        patientRecords.map((record) => renderPatientRecord(record))
      ) : (
        <EmptyRecordsComponent />
      )}
    </View>
  );

  if (loading && !filteredTasks.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a2a6c" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <LinearGradient
        colors={["#1a2a6c", "#3e4c88"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.header}>Welcome Back!</Text>
            <Text style={styles.subHeader}>{business.name}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        {activeTab === "overview" && (
          <>
            <SnapshotCards business={business} />

            <View style={styles.sectionHeader}>
              <MaterialIcons name="add-task" size={24} color="#1a2a6c" />
              <Text style={styles.sectionTitle}>Create New Task</Text>
            </View>

            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder="Task Title"
                value={taskForm.title}
                onChangeText={(text) =>
                  setTaskForm({ ...taskForm, title: text })
                }
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Task Description"
                value={taskForm.description}
                onChangeText={(text) =>
                  setTaskForm({ ...taskForm, description: text })
                }
                multiline={true}
                numberOfLines={4}
              />

              <Text style={styles.label}>Priority</Text>
              <DropDownPicker
                listMode="SCROLLVIEW"
                open={priorityDropdownOpen}
                setOpen={setPriorityDropdownOpen}
                items={priorityItems}
                value={taskForm.priority}
                onChangeValue={(val) =>
                  setTaskForm((prev) =>
                    prev.priority === val ? prev : { ...prev, priority: val }
                  )
                }
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Select priority"
              />

              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: "#333" }}>
                  {taskForm.due_date.toISOString().split("T")[0]}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={taskForm.due_date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setTaskForm({ ...taskForm, due_date: selectedDate });
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Assign to</Text>
              <DropDownPicker
                listMode="SCROLLVIEW"
                open={employeeDropdownOpen}
                setOpen={setEmployeeDropdownOpen}
                items={employeeItems}
                setItems={setEmployeeItems}
                value={selectedEmployees}
                setValue={setSelectedEmployees}
                multiple={true}
                placeholder="Select employees"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                badgeColors={["#1a2a6c"]}
                badgeTextStyle={{ color: "#fff" }}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="add-circle" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Create Task</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === "records" && renderRecordsSection()}
        {activeTab === "manage" && <ManageEmployees business={business} />}

        {activeTab === "payroll" && (
          <PayrollTab
            business={business}
            payPeriod={new Date().toISOString().slice(0, 7)}
          />
        )}

        {(activeTab === "overview" || activeTab === "analytics") && (
          <>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="list" size={24} color="#1a2a6c" />
              <Text style={styles.sectionTitle}>Task Management</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContainer}
              style={styles.filterContainer}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  taskFilter === "all" && styles.activeFilterButton,
                ]}
                onPress={() => setTaskFilter("all")}
              >
                <Text
                  style={[
                    styles.filterText,
                    taskFilter === "all" && styles.activeFilterText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  taskFilter === "pending" && styles.activeFilterButton,
                ]}
                onPress={() => setTaskFilter("pending")}
              >
                <Text
                  style={[
                    styles.filterText,
                    taskFilter === "pending" && styles.activeFilterText,
                  ]}
                >
                  Pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  taskFilter === "completed" && styles.activeFilterButton,
                ]}
                onPress={() => setTaskFilter("completed")}
              >
                <Text
                  style={[
                    styles.filterText,
                    taskFilter === "completed" && styles.activeFilterText,
                  ]}
                >
                  Completed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  taskFilter === "approved" && styles.activeFilterButton,
                ]}
                onPress={() => setTaskFilter("approved")}
              >
                <Text
                  style={[
                    styles.filterText,
                    taskFilter === "approved" && styles.activeFilterText,
                  ]}
                >
                  Approved
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {loading && filteredTasks.length > 0 ? (
              <ActivityIndicator
                size="large"
                color="#1a2a6c"
                style={styles.listLoader}
              />
            ) : filteredTasks.length > 0 ? (
              <FlatList
                data={filteredTasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTaskItem}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No {taskFilter !== "all" ? taskFilter : ""} tasks found
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default OwnerDashboard;

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: "#f5f7fa",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#1a2a6c",
    fontSize: 16,
  },
  headerGradient: {
    paddingVertical: 25,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  subHeader: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  statusIndicator: {
    alignItems: "flex-end",
  },
  statusLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusToggleButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusToggleText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2a6c",
    marginLeft: 8,
    marginBottom:12,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a2a6c",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dropdown: {
    marginBottom: 20,
    borderRadius: 8,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    zIndex: 1000,
  },
  dropdownContainer: {
    borderColor: "#e0e0e0",
    borderRadius: 8,
    zIndex: 2000,
  },
  submitButton: {
    backgroundColor: "#FF8008",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  taskCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  priorityIndicator: {
    width: 4,
    height: "100%",
    borderRadius: 2,
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
    color: "#1a2a6c",
  },
  taskDescription: {
    fontSize: 15,
    color: "#444",
    marginBottom: 12,
    lineHeight: 22,
  },
  taskMetaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  taskMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 13,
    color: "#555",
    marginLeft: 4,
  },
  pendingBadge: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: "#64B5F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: "#81C784",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rejectedBadge: {
    backgroundColor: "#E57373",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 0.48,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },
   // Records Section
  
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
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#1a2a6c",
  },
  filterText: {
    color: "#555",
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#fff",
  },
  listLoader: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  activityContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityItem: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#f5f7fa",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    justifyContent: "center",
  },
  activityMessage: {
    fontSize: 14,
    color: "#333",
  },
  activityTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  staffInfoContainer: {
    marginTop: 8,
  },
  staffInfoDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
  },
  staffInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  staffInfoText: {
    fontSize: 11,
    color: "#666666",
    marginLeft: 6,
    fontStyle: "italic",
  },
  specializationBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  specializationText: {
    fontSize: 10,
    color: "#1976D2",
    fontWeight: "500",
  },
});
