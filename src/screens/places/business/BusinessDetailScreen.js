import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { getAuth } from "firebase/auth";
import OwnerDashboard from "./components/OwnerDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import VisitorView from "./components/VisitorView";

const BusinessDetailScreen = ({ route }) => {
  const { business } = route.params;
  const [role, setRole] = useState(null); // "owner" | "employee" | "visitor"
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [business]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8008" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {role === "owner" && (
        <OwnerDashboard business={business} currentUser={currentUser} />
      )}
      {role === "employee" && (
        <EmployeeDashboard business={business} currentUser={currentUser} />
      )}
      {role === "visitor" && <VisitorView business={business} />}
    </SafeAreaView>
  );
};

export default BusinessDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
  },
});
