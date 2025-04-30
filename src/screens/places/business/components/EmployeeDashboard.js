import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../../../backend/firebase";

const EmployeeDashboard = ({ business, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const taskRef = collection(
        db,
        "businesses",
        business.business_id,
        "tasks"
      );
      const q = query(taskRef, where("assigned_to", "==", currentUser.uid));
      const snapshot = await getDocs(q);

      const userTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(userTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const markAsCompleted = async (taskId) => {
    try {
      const taskDoc = doc(
        db,
        "businesses",
        business.business_id,
        "tasks",
        taskId
      );
      await updateDoc(taskDoc, {
        status: "completed",
      });
      Alert.alert("Task marked as completed");
      fetchTasks(); // Refresh
    } catch (err) {
      console.error("Error marking task complete:", err);
      Alert.alert("Failed to update task.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskStatus}>Status: {item.status}</Text>

      {item.status === "pending" && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => markAsCompleted(item.id)}
        >
          <Text style={styles.doneText}>Mark as Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.noTasks}>No tasks assigned to you.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default EmployeeDashboard;

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
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
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
  taskStatus: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  doneButton: {
    backgroundColor: "#FF8008",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  doneText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noTasks: {
    textAlign: "center",
    color: "#666",
    marginTop: 30,
    fontSize: 16,
  },
});
