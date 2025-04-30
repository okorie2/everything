import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../../../backend/firebase"; // Adjust the import path as necessary
import DropDownPicker from "react-native-dropdown-picker";

const OwnerDashboard = ({ business, currentUser }) => {
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(business.status || "open");
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [employeeItems, setEmployeeItems] = useState([]); // dropdown items
  const [selectedEmployees, setSelectedEmployees] = useState([]); // selected UIDs

  // Fetch employees from user collection
  useEffect(() => {
    const fetchEmployees = async () => {
      const employeeDocs = await Promise.all(
        (business.employees || []).map(async (uid) => {
          const userDoc = await getDocs(
            query(collection(db, "user"), where("__name__", "==", uid))
          );
          const data = userDoc.docs[0]?.data();
          return { label: `${data.first_name} ${data.last_name}`, value: uid };
        })
      );
      setEmployeeItems(employeeDocs);
    };

    fetchEmployees();
  }, [business]);

  // Fetch all tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const taskRef = collection(
        db,
        "businesses",
        business.business_id,
        "tasks"
      );
      const snapshot = await getDocs(taskRef);
      const allTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(allTasks);
    };
    fetchTasks();
  }, [business]);

  const handleCreateTask = async () => {
    const { title, description } = taskForm;
    if (!title || !description || selectedEmployees.length === 0) {
      Alert.alert("All task fields are required.");
      return;
    }

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
          status: "pending",
          created_at: serverTimestamp(),
          completed_at: null,
        })
      );

      await Promise.all(batch);

      Alert.alert("Tasks created for selected employees!");
      setTaskForm({ title: "", description: "", assignedTo: "" });
      setSelectedEmployees([]);
    } catch (err) {
      console.error(err);
      Alert.alert("Failed to create tasks.");
    }
  };

  const toggleBusinessStatus = async () => {
    const newStatus = status === "open" ? "closed" : "open";
    try {
      const businessRef = firestoreDoc(db, "businesses", business.business_id);
      await updateDoc(businessRef, { status: newStatus });
      setStatus(newStatus);
      Alert.alert("Status Updated", `Business is now marked as ${newStatus}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      Alert.alert("Failed to update business status");
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskDoc = doc(
        db,
        "businesses",
        business.business_id,
        "tasks",
        taskId
      );
      await updateDoc(taskDoc, { status: newStatus });
      Alert.alert(`Task marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Failed to update task status.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome, Business Owner</Text>
      <Text style={styles.subHeader}>{business.name}</Text>
      <Text style={styles.label}>Create New Task</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={taskForm.title}
        onChangeText={(text) => setTaskForm({ ...taskForm, title: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={taskForm.description}
        onChangeText={(text) => setTaskForm({ ...taskForm, description: text })}
      />
      <Text style={styles.label}>Assign to</Text>
      <DropDownPicker
        open={employeeDropdownOpen}
        setOpen={setEmployeeDropdownOpen}
        items={employeeItems}
        setItems={setEmployeeItems}
        value={selectedEmployees}
        setValue={setSelectedEmployees}
        multiple={true}
        placeholder="Select employees"
        style={styles.dropdown}
        badgeColors={["#1a2a6c"]}
        badgeTextStyle={{ color: "#fff" }}
        dropDownContainerStyle={{ borderColor: "#ccc" }}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreateTask}>
        <Text style={styles.buttonText}>Create Task</Text>
      </TouchableOpacity>

      <Text style={styles.label}>All Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDescription}>{item.description}</Text>
            <Text style={styles.taskMeta}>
              Assigned to: {item.assigned_to} | Status: {item.status}
            </Text>

            {item.status === "completed" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleUpdateTaskStatus(item.id, "approved")}
                  style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                >
                  <Text style={styles.actionText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleUpdateTaskStatus(item.id, "rejected")}
                  style={[styles.actionButton, { backgroundColor: "#F44336" }]}
                >
                  <Text style={styles.actionText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Business Status:</Text>
        <Text style={styles.statusText}>
          Currently: {status === "open" ? "🟢 Open" : "🔴 Closed"}
        </Text>
        <TouchableOpacity style={styles.button} onPress={toggleBusinessStatus}>
          <Text style={styles.buttonText}>
            Mark as {status === "open" ? "Closed" : "Open"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OwnerDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a2a6c",
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    color: "#1a2a6c",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#FF8008",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  taskCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: "#eee",
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a2a6c",
  },
  taskDescription: {
    fontSize: 14,
    color: "#444",
    marginVertical: 4,
  },
  taskMeta: {
    fontSize: 12,
    color: "#888",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#1a2a6c",
  },
  dropdown: {
    marginBottom: 20,
    borderRadius: 10,
    borderColor: "#ddd",
  },
});
