import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  StatusBar,
  Pressable,
} from "react-native";
import { getAuth } from "firebase/auth";
import OwnerDashboard from "./components/OwnerDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import VisitorView from "./components/VisitorView";

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
  const { business } = route.params;
  const [role, setRole] = useState(null); // "owner" | "employee" | "visitor"
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Set up the header title
    navigation?.setOptions({
      title: business?.name || "Business Details",
      headerStyle: {
        backgroundColor: COLORS.secondary,
      },
      headerTintColor: "#ffffff",
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

  const renderTabButton = (tabName, label, icon) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          isActive && {
            borderBottomColor: COLORS.primary,
            borderBottomWidth: 3,
          },
        ]}
        onPress={() => setActiveTab(tabName)}
      >
        <Text
          style={[
            styles.tabButtonText,
            isActive && { color: COLORS.primary, fontWeight: "700" },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRoleBadge = () => {
    let badgeStyle = styles.visitorBadge;
    let badgeText = "Visitor";

    if (role === "owner") {
      badgeStyle = styles.ownerBadge;
      badgeText = "Owner";
    } else if (role === "employee") {
      badgeStyle = styles.employeeBadge;
      badgeText = "Employee";
    }

    return (
      <View style={styles.badgeContainer}>
        <View style={badgeStyle}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </View>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* Business Header */}
      <View style={styles.businessHeader}>
        <View style={styles.headerTopRow}>
          <Pressable
            style={styles.backButton}
            onPress={handleGoBack}
            android_ripple={{
              color: "rgba(255,255,255,0.2)",
              borderless: true,
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.businessCategory}>{business.category}</Text>
            {renderRoleBadge()}
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton("overview", "Overview")}
        {role === "owner" && renderTabButton("manage", "Manage")}
        {(role === "owner" || role === "employee") &&
          renderTabButton("analytics", "Analytics")}
        {renderTabButton("info", "Information")}
      </View>

      {/* Content Area - No ScrollView wrapper to avoid nesting issues */}
      <View style={styles.contentContainer}>
        {role === "owner" && (
          <OwnerDashboard business={business} activeTab={activeTab} />
        )}

        {role === "employee" && (
          <EmployeeDashboard business={business} activeTab={activeTab} />
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
  businessHeader: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "300",
  },
  businessInfo: {
    flexDirection: "column",
    flex: 1,
  },
  businessName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  businessCategory: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    marginTop: 6,
  },
  ownerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  employeeBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  visitorBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
});
