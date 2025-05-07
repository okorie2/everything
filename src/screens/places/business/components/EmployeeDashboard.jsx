import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  delay,
} from "firebase/firestore";
import { db } from "../../../../../backend/firebase";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import ClockWidget from "./ClockWidget"; // add at top
import { getAuth } from "firebase/auth";

const ScrollableTabView = ({ children }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 8 }}
  >
    {children}
  </ScrollView>
);
// Constants for colors
const COLORS = {
  primary: "#FF8008", // Orange (active primary)
  secondary: "#1a2a6c", // Deep blue
  background: "#f8f9fa",
  cardBg: "#ffffff",
  textPrimary: "#333333",
  textSecondary: "#666666",
  textLight: "#999999",
  pending: "#FF8008",
  inProgress: "#3498db",
  completed: "#2ecc71",
  urgent: "#e74c3c",
  border: "#eeeeee",
};

const EmployeeDashboard = ({ business, navigation, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Animation values
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [120, 70],
    extrapolate: "clamp",
  });

  const auth = getAuth();

  const fetchTasks = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "User not authenticated. Please login.");
      return;
    }

    try {
      setLoading(true);
      const taskRef = collection(
        db,
        "businesses",
        business.business_id,
        "tasks"
      );
      const q = query(
        taskRef,
        where("assigned_to", "==", currentUser.uid)
        // remove orderBy for now
      );

      const snapshot = await getDocs(q);

      const userTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Format dates if they exist
        due_date: doc.data().due_date
          ? new Date(doc.data().due_date.seconds * 1000)
          : null,
        created_at: doc.data().created_at
          ? new Date(doc.data().created_at.seconds * 1000)
          : new Date(),
      }));

      setTasks(userTasks);
      setFilteredTasks(userTasks);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      Alert.alert("Error", "Failed to load your tasks. Please try again.");
      setLoading(false);
    }
  };

  const writeDailySummary = async () => {
    const todayId = new Date().toISOString().slice(0, 10);
    const count = tasks.filter((t) => t.consult_end).length;

    await addDoc(
      collection(
        db,
        "businesses",
        HOSPITAL_ID,
        "activities",
        currentUser.uid,
        todayId
      ),
      {
        patient_count: count,
        issues: "",
        created_at: Timestamp.now(),
      }
    );
    Alert.alert("Summary saved", `${count} patients logged`);
  };

  useEffect(() => {
    fetchTasks();
    // Set up a task refresh interval every 5 minutes (optional)
    const refreshInterval = setInterval(() => {
      if (!refreshing) fetchTasks();
    }, 300000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter tasks when selected filter changes
  useEffect(() => {
    filterTasks(selectedFilter);
  }, [selectedFilter, tasks]);

  const filterTasks = (filter) => {
    switch (filter) {
      case "pending":
        setFilteredTasks(tasks.filter((task) => task.status === "pending"));
        break;
      case "in-progress":
        setFilteredTasks(tasks.filter((task) => task.status === "in-progress"));
        break;
      case "completed":
        setFilteredTasks(tasks.filter((task) => task.status === "completed"));
        break;
      case "urgent":
        setFilteredTasks(tasks.filter((task) => task.priority === "high"));
        break;
      default:
        setFilteredTasks(tasks);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskDoc = doc(
        db,
        "businesses",
        business.business_id,
        "tasks",
        taskId
      );
      await updateDoc(taskDoc, {
        status: newStatus,
        updated_at: new Date(),
      });

      // Show different messages based on status
      const message =
        newStatus === "completed"
          ? "Task marked as completed!"
          : "Task status updated!";

      Alert.alert("Success", message);
      fetchTasks(); // Refresh tasks
    } catch (err) {
      console.error("Error updating task:", err);
      Alert.alert("Error", "Failed to update task status.");
    }
  };

  // Format date to a readable string
  const formatDate = (date) => {
    if (!date) return "No deadline";

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Get status color based on task status
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return COLORS.pending;
      case "in-progress":
        return COLORS.inProgress;
      case "completed":
        return COLORS.completed;
      default:
        return COLORS.textLight;
    }
  };

  // Check if a task is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && dueDate.toDateString() !== today.toDateString();
  };

  // Filter tab component
  const FilterTab = ({ title, value, icon }) => (
    <TouchableOpacity
      style={[
        styles.filterTab,
        selectedFilter === value && { backgroundColor: COLORS.primary },
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Ionicons
        name={icon}
        size={16}
        color={selectedFilter === value ? "#fff" : COLORS.textSecondary}
      />
      <Text
        style={[
          styles.filterText,
          selectedFilter === value && { color: "#fff" },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderTaskActions = (task) => {
    if (task.status === "completed") {
      return (
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.pending }]}
            onPress={() => updateTaskStatus(task.id, "pending")}
          >
            <MaterialIcons name="replay" size={16} color="#fff" />
            <Text style={styles.actionText}>Reopen</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (task.status === "pending") {
      return (
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: COLORS.inProgress },
            ]}
            onPress={() => updateTaskStatus(task.id, "in-progress")}
          >
            <MaterialIcons name="play-arrow" size={16} color="#fff" />
            <Text style={styles.actionText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.completed }]}
            onPress={() => updateTaskStatus(task.id, "completed")}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.actionText}>Complete</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.completed }]}
            onPress={() => updateTaskStatus(task.id, "completed")}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.actionText}>Complete</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const renderItem = ({ item }) => {
    // Calculate progress for the task based on steps or simply based on status
    let progress = 0;
    if (item.status === "in-progress") progress = 0.5;
    else if (item.status === "completed") progress = 1;

    return (
      <Animated.View
        style={[styles.taskCard, item.priority === "high" && styles.urgentTask]}
      >
        {/* Priority indicator */}
        {item.priority === "high" && (
          <View style={styles.priorityBadge}>
            <MaterialIcons name="priority-high" size={12} color="#fff" />
            <Text style={styles.priorityText}>Urgent</Text>
          </View>
        )}

        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.taskDescription}>{item.description}</Text>

        {/* Task details section */}
        <View style={styles.taskDetails}>
          {/* Due date with icon */}
          <View style={styles.detailItem}>
            <MaterialIcons
              name="event"
              size={14}
              color={
                isOverdue(item.due_date) ? COLORS.urgent : COLORS.textLight
              }
            />
            <Text
              style={[
                styles.detailText,
                isOverdue(item.due_date) && styles.overdueText,
              ]}
            >
              {item.due_date ? formatDate(item.due_date) : "No deadline"}
              {isOverdue(item.due_date) && " (Overdue)"}
            </Text>
          </View>

          {/* Category if available */}
          {item.category && (
            <View style={styles.detailItem}>
              <MaterialIcons
                name="category"
                size={14}
                color={COLORS.textLight}
              />
              <Text style={styles.detailText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Action buttons based on status */}
        {renderTaskActions(item)}
      </Animated.View>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../../../../assets/empty.gif")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>
        {selectedFilter === "all"
          ? "No tasks assigned to you"
          : `No ${selectedFilter} tasks`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === "all"
          ? "Great job! Take a break or check back later for new assignments."
          : `Switch to a different filter to see other tasks.`}
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <MaterialIcons name="refresh" size={14} color="#fff" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri:
                currentUser?.photoURL ||
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc_8D2LQ6r3SlQFDRKTvkjhNXxLNcuE8JKMQ&s",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>
              {currentUser?.displayName || "Employee"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons
              name="notifications"
              size={24}
              color={COLORS.secondary}
            />
            {tasks.filter(
              (t) => t.status === "pending" && t.priority === "high"
            ).length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {
                    tasks.filter(
                      (t) => t.status === "pending" && t.priority === "high"
                    ).length
                  }
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollableTabView>
          <FilterTab title="All" value="all" icon="list" />
          <FilterTab title="Pending" value="pending" icon="time-outline" />
          <FilterTab title="In Progress" value="in-progress" icon="play" />
          <FilterTab
            title="Completed"
            value="completed"
            icon="checkmark-circle"
          />
          <FilterTab title="Urgent" value="urgent" icon="warning" />
        </ScrollableTabView>
      </View>

      {/* Task summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: COLORS.pending + "20" },
            ]}
          >
            <MaterialIcons
              name="hourglass-empty"
              size={20}
              color={COLORS.pending}
            />
          </View>
          <Text style={styles.summaryCount}>
            {tasks.filter((task) => task.status === "pending").length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: COLORS.inProgress + "20" },
            ]}
          >
            <MaterialIcons
              name="play-circle-filled"
              size={20}
              color={COLORS.inProgress}
            />
          </View>
          <Text style={styles.summaryCount}>
            {tasks.filter((task) => task.status === "in-progress").length}
          </Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: COLORS.completed + "20" },
            ]}
          >
            <MaterialIcons
              name="check-circle"
              size={20}
              color={COLORS.completed}
            />
          </View>
          <Text style={styles.summaryCount}>
            {tasks.filter((task) => task.status === "completed").length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      <ClockWidget bizId={business.business_id} />

      {/* Task List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={EmptyListComponent}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      )}

      {/* Add task floating button */}
      <TouchableOpacity style={styles.button} onPress={writeDailySummary}>
        <Text style={styles.buttonText}>Daily Summary</Text>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    marginLeft: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.urgent,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBg,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  filterContainer: {
    marginVertical: 14,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: width / 3.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  taskCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.pending,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  urgentTask: {
    borderLeftColor: COLORS.urgent,
    borderTopRightRadius: 0,
  },
  priorityBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.urgent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  priorityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  taskDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  overdueText: {
    color: COLORS.urgent,
    fontWeight: "500",
  },
  taskActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
export default EmployeeDashboard;
