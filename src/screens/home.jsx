import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../backend/firebase";
import { getPartOfDay } from "../util/helper";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  // user profile
  const [userData, setUserData] = useState({
    name: "User",
    profileImage: null,
  });

  // activity counts
  const [counts, setCounts] = useState({
    bookings: 0,
    applications: 0,
    visits: 0,
  });

  // quick-action buttons
  const quickActions = [
    { title: "Go Somewhere", icon: "map-marker", screen: "BusinessList" },
    {
      title: "Register Business",
      icon: "briefcase",
      screen: "RegisterBusiness",
    },
    {
      title: "Book Appointment",
      icon: "calendar-clock",
      screen: "Appointment",
    },
    { title: "City Services", icon: "city", screen: "CityServices" },
  ];

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    // 1) fetch profile
    const fetchProfile = async () => {
      if (!user) return;
      const userRef = doc(db, "user", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserData({
          name: data.first_name ?? data.displayName ?? "User",
          profileImage: data.profileImage ?? null,
        });
      }
    };

    // 2) fetch activity counts
    const fetchCounts = async () => {
      if (!user) return;
      // a) all appointments for this user
      const appointmentsQ = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid)
      );
      const apptSnap = await getDocs(appointmentsQ);
      const totalBookings = apptSnap.size;

      // b) all “applications”—we’ll treat the “jobs” collection as applications
      const jobsQ = query(
        collection(db, "jobs"),
        where("userId", "==", user.uid)
      );
      const jobsSnap = await getDocs(jobsQ);
      const totalApplications = jobsSnap.size;

      // c) visits: count of completed appointments
      const completedQ = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid),
        where("status", "==", "completed")
      );
      const compSnap = await getDocs(completedQ);
      const totalVisits = compSnap.size;

      setCounts({
        bookings: totalBookings,
        applications: totalApplications,
        visits: totalVisits,
      });
    };

    fetchProfile();
    fetchCounts();
  }, [user]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchCounts = async () => {
      try {
        // 1) Applications = how many businesses they own
        const appsSnap = await getDocs(
          query(collection(db, "businesses"), where("owner_id", "==", user.uid))
        );

        // 2) Bookings = how many appointment docs they’ve created
        const bookingsSnap = await getDocs(
          query(collection(db, "appointments"), where("userId", "==", user.uid))
        );

        // 3) Visits = how many “visit” activity entries we logged above
        const visitsSnap = await getDocs(
          query(
            collection(db, "user_activity"),
            where("userId", "==", user.uid),
            where("type", "==", "visit")
          )
        );

        setCounts({
          applications: appsSnap.size,
          bookings: bookingsSnap.size,
          visits: visitsSnap.size,
        });
      } catch (err) {
        console.error("Error fetching activity counts:", err);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "businesses"));
      const unique = [
        ...new Set(snap.docs.map((doc) => doc.data().category).filter(Boolean)),
      ];
      setCategories(unique.slice(0, 3)); // Show first 3 only
    };

    fetchCategories();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8008" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient colors={["#FF8008", "#FFB247"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hey, Good {getPartOfDay()}!</Text>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.weatherInfo}>
                It’s a bright day in Bethel City
              </Text>
            </View>
            {/*
            // you can re-enable profile image if you like
            <TouchableOpacity style={styles.profileImageContainer}>
              {userData.profileImage ? (
                <Image
                  source={{ uri: userData.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileInitials}>
                  <Text style={styles.initialsText}>
                    {userData.name.charAt(0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            */}
          </View>
          <TouchableOpacity style={styles.notificationIcon}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* QUICK ACTION PROMPT */}
        <View style={styles.actionPromptContainer}>
          <Text style={styles.actionPromptText}>
            What would you like to do today?
          </Text>
        </View>

        {/* CTA CARDS */}
        <View style={styles.ctaContainer}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.ctaCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <MaterialCommunityIcons
                name={action.icon}
                size={28}
                color="#1a2a6c"
              />
              <Text style={styles.ctaText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickAccessContainer}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {categories.map((label, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickAccessItem}
                onPress={() =>
                  navigation.navigate("BusinessList", { initialFilter: label })
                }
              >
                <View style={styles.quickAccessIconContainer}>
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={24}
                    color="#fff"
                  />
                </View>
                <Text style={styles.quickAccessText}>{label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.quickAccessItem}
              onPress={() =>
                navigation.navigate("BusinessList", { initialFilter: "All" })
              }
            >
              <View style={styles.quickAccessIconContainer}>
                <MaterialCommunityIcons
                  name="dots-horizontal"
                  size={24}
                  color="#fff"
                />
              </View>
              <Text style={styles.quickAccessText}>More</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* YOUR ACTIVITY */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{counts.bookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{counts.applications}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{counts.visits}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
          </View>
        </View>

        {/* EXPLORE SECTION */}
        <LinearGradient
          colors={["#1D4ED8", "#0284C7"]}
          style={styles.exploreContainer}
        >
          <Text style={styles.exploreTitle}>Discover Bethel City</Text>
          <Text style={styles.exploreDescription}>
            Explore events, attractions, and services available in your
            community.
          </Text>
          <TouchableOpacity style={styles.exploreButton}>
            <Text style={styles.exploreButtonText}>Explore Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f7" },
  header: {
    paddingTop: 40,
    padding: 20,
    backgroundColor: "#FF8008",
  },
  headerContent: { flexDirection: "row", justifyContent: "space-between" },
  greeting: { color: "#fff", fontSize: 16, opacity: 0.9 },
  userName: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  weatherInfo: { color: "#fff", fontSize: 14, marginTop: 5, opacity: 0.85 },
  notificationIcon: { position: "absolute", top: 40, right: 20 },
  actionPromptContainer: {
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  actionPromptText: { fontSize: 22, fontWeight: "bold", color: "#1D4ED8" },
  ctaContainer: { marginHorizontal: 20, marginTop: 15 },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  ctaText: {
    marginLeft: 15,
    fontSize: 17,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  quickAccessContainer: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D4ED8",
    marginBottom: 15,
  },
  quickAccessGrid: { flexDirection: "row", justifyContent: "space-between" },
  quickAccessItem: { alignItems: "center" },
  quickAccessIconContainer: {
    backgroundColor: "#FF8008",
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickAccessText: { fontSize: 12, fontWeight: "500", color: "#333" },
  statsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    elevation: 2,
  },
  statsGrid: { flexDirection: "row", justifyContent: "space-between" },
  statItem: {
    width: (width - 80) / 3,
    alignItems: "center",
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#FF8008" },
  statLabel: { fontSize: 14, color: "#666", marginTop: 4 },
  exploreContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  exploreTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
  },
  exploreDescription: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.9,
  },
  exploreButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  exploreButtonText: { color: "#1D4ED8", fontWeight: "700", fontSize: 16 },
});
