import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Pressable,
} from "react-native";
import { getAuth } from "firebase/auth";
import OwnerDashboard from "./components/OwnerDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import VisitorView from "./components/VisitorView";
import {
  collection,
  addDoc,
  Timestamp,
  onSnapshot,
  query,
} from "firebase/firestore";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../backend/firebase"; // Adjust the import path as needed

// Define theme colors
const COLORS = {
  primary: "#FF8008", // Orange - active primary
  secondary: "#1a2a6c", // Deep blue
  background: "#f8f9fa",
  card: "#ffffff",
  text: "#333333",
  textLight: "#767676",
  border: "#e0e0e0",
  success: "#4CAF50",
  error: "#F44336",
};

const BusinessDetailScreen = ({ route, navigation }) => {
  const { business: routeBusiness } = route.params;
  const business_id = routeBusiness?.docId ?? routeBusiness?.business_id ?? "";
  const [role, setRole] = useState(null); // "owner" | "employee" | "visitor"
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [business, setBusiness] = useState(routeBusiness);

  const setupRealtimeListener = useCallback(() => {
    try {
      if (!auth.currentUser) return () => {}; // no-op if user is not signed in

      const ref = doc(db, "businesses", business_id);
      if (!ref) return () => {}; // no-op if ref is not valid
      const q = query(ref);

      return onSnapshot(
        q,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setBusiness(data);
          }
          setLoading(false);
        },
        (err) => {
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error setting up realtime listener:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = setupRealtimeListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setupRealtimeListener]);

  useEffect(() => {
    // Set up the header title
    navigation?.setOptions({
      title: "",
      headerShown: false,
    });

    const auth = getAuth();
    const user = auth.currentUser;
    setCurrentUser(user);

    if (!user) {
      setRole("visitor");
      setLoading(false);
      return;
    }

    if (business.owner_id === user.uid) {
      setRole("owner");
    } else if (business.employees?.includes(user.uid)) {
      setRole("employee");
    } else {
      setRole("visitor");
    }

    setLoading(false);
  }, [business, navigation]);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        return;
      }

      const snap = await getDoc(doc(db, "user", currentUser.uid));
      if (snap.exists()) {
        const admin = snap.data()?.isAdmin === true;
        setIsAdmin(admin);
      } else {
      }
    };

    fetchAdminStatus();
  }, []);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        await addDoc(collection(db, "user_activity"), {
          userId: auth.currentUser.uid,
          type: "visit",
          businessId: business_id,
          timestamp: Timestamp.now(),
        });
      } catch (e) {
        console.error("Error logging visit:", e);
      }
    };

    recordVisit();
  }, []);

  const renderTabButton = (tabName, label) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tabName)}
      >
        <Text
          style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const getRoleBadgeStyle = () => {
    if (role === "owner") {
      return {
        badgeStyle: styles.ownerBadge,
        textStyle: styles.ownerBadgeText,
        text: "Owner",
      };
    } else if (role === "employee") {
      return {
        badgeStyle: styles.employeeBadge,
        textStyle: styles.employeeBadgeText,
        text: "Employee",
      };
    } else {
      return {
        badgeStyle: styles.visitorBadge,
        textStyle: styles.visitorBadgeText,
        text: "Visitor",
      };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.secondary}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading business details...</Text>
      </SafeAreaView>
    );
  }

  const handleGoBack = () => {
    navigation.goBack();
  };

  const { badgeStyle, textStyle, text } = getRoleBadgeStyle();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* Integrated Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleGoBack}
          android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business.name}</Text>
          <View style={styles.businessMeta}>
            <Text style={styles.businessCategory}>{business.category}</Text>
            <View style={badgeStyle}>
              <Text style={textStyle}>{text}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton("overview", "Overview")}
        {role === "owner" && renderTabButton("manage", "Manage")}
        {role === "owner" && isAdmin && renderTabButton("records", "Records")}
        {(role === "owner" || role === "employee") &&
          renderTabButton("analytics", "Analytics")}
        {role === "owner" && renderTabButton("payroll", "Payroll")}
      </View>

      {/* Admin Approval Button */}
      {isAdmin && business.status === "pending_approval" && (
        <TouchableOpacity
          onPress={async () => {
            try {
              await updateDoc(
                doc(db, "businesses", business?.docId ?? business.business_id),
                {
                  status: "approved",
                }
              );

              Alert.alert(
                "Business Approved",
                "The business has been approved."
              );
              navigation.goBack();
            } catch (err) {
              console.error("Approval error:", err);
              Alert.alert("Error", "Failed to approve business.");
            }
          }}
          style={styles.approveButton}
        >
          <Text style={styles.approveButtonText}>Approve Business</Text>
        </TouchableOpacity>
      )}

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {role === "owner" && (
          <OwnerDashboard business={business} activeTab={activeTab} />
        )}

        {role === "employee" && (
          <EmployeeDashboard
            business={business}
            activeTab={activeTab}
            navigation={navigation}
            currentUser={currentUser}
          />
        )}

        {role === "visitor" && (
          <VisitorView business={business} activeTab={activeTab} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default BusinessDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 16,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "300",
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  businessMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  businessCategory: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    fontWeight: "500",
    marginRight: 12,
  },
  ownerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  employeeBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  visitorBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ownerBadgeText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 11,
  },
  employeeBadgeText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 11,
  },
  visitorBadgeText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 11,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    paddingHorizontal: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeTabButton: {
    backgroundColor: "transparent",
  },
  tabButtonText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  activeTabButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    position: "relative",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 2,
  },
  approveButton: {
    backgroundColor: COLORS.success,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  approveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
});
