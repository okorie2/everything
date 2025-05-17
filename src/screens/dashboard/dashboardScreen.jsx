import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../backend/firebase";
import { getPartOfDay } from "../../util/helper";
import StatsSection from "./statsSection";

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
    { title: "City Services", icon: "city", screen: "CityServices" },
  ];

  const [categories, setCategories] = useState([]);
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

  useEffect(() => {
    if (!user) return;

    // Set up appointments listener
    const unsubAppointments = onSnapshot(
      query(collection(db, "appointments"), where("userId", "==", user.uid)),
      (apptSnap) => {
        const totalBookings = apptSnap.size;

        setCounts((prev) => ({
          ...prev,
          bookings: totalBookings,
        }));
      }
    );

    // Track business listener so we can unsubscribe later
    let unsubBiz = () => {};

    // Set up jobs listener
    const unsubJobs = onSnapshot(
      query(collection(db, "jobs"), where("userId", "==", user.uid)),
      (jobsSnap) => {
        const totalJobs = jobsSnap.size;

        // Unsubscribe from any previous business listener
        unsubBiz();

        // Set up new business listener
        unsubBiz = onSnapshot(
          query(
            collection(db, "businesses"),
            where("owner_id", "==", user.uid),
            where("status", "==", "pending_approval")
          ),
          (bizSnap) => {
            const totalApplications = totalJobs + bizSnap.size;

            setCounts((prev) => ({
              ...prev,
              applications: totalApplications,
            }));
          }
        );
      }
    );

    // Full cleanup
    return () => {
      unsubAppointments();
      unsubJobs();
      unsubBiz(); // very important
    };
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

        // 2) Bookings = how many appointment docs they've created
        const bookingsSnap = await getDocs(
          query(collection(db, "appointments"), where("userId", "==", user.uid))
        );

        // 3) Visits = how many "visit" activity entries we logged above
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
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "businesses"));
      const unique = [
        ...new Set(snap.docs.map((doc) => doc.data().category).filter(Boolean)),
      ];
      // Filter out "Food and Confectionery" category
      const filtered = unique.filter((cat) => cat !== "Food and Confectionery");
      setCategories(filtered.slice(0, 3)); // Show first 3 only
    };

    fetchCategories();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* REDESIGNED HEADER */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={styles.headerTopRow}>
              <View style={styles.profileSection}>
                {userData.profileImage ? (
                  <Image
                    source={{ uri: userData.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileInitial}>
                      {userData.name.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfoContainer}>
                  <Text style={styles.greeting}>Good {getPartOfDay()}</Text>
                  <Text style={styles.userName}>{userData.name}</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={24}
                    color="#333"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.headerBottomRow}>
              <View style={styles.weatherCard}>
                <MaterialCommunityIcons
                  name="weather-sunny"
                  size={20}
                  color="#FFD700"
                />
                <Text style={styles.weatherInfo}>
                  Bright day in Bethel City
                </Text>
              </View>
            </View>
          </View>
        </View>

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
              style={[styles.ctaCard, i === 0 && styles.ctaCardOrange]}
              onPress={() => navigation.navigate(action.screen)}
            >
              <MaterialCommunityIcons
                name={action.icon}
                size={28}
                color={i === 0 ? "#FFF" : "#666"}
              />
              <Text style={[styles.ctaText, i === 0 && styles.ctaTextWhite]}>
                {action.title}
              </Text>
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
                  navigation.navigate("BusinessList", {
                    initialFilter: label,
                  })
                }
              >
                <View
                  style={[
                    styles.quickAccessIconContainer,
                    i === 0 && styles.quickAccessIconContainerBlue,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={24}
                    color={i === 0 ? "#FFF" : "#666"}
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
                  color="#666"
                />
              </View>
              <Text style={styles.quickAccessText}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* YOUR ACTIVITY */}
        <StatsSection counts={counts} />

        {/* EXPLORE SECTION */}
        <View style={styles.exploreContainer}>
          <Text style={styles.exploreTitle}>Discover Bethel City</Text>
          <Text style={styles.exploreDescription}>
            Explore events, attractions, and services available in your
            community.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => {
              navigation.navigate("BusinessList", { initialFilter: "All" });
            }}
          >
            <Text style={styles.exploreButtonText}>Explore Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#F0F0F0",
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#666",
    fontSize: 22,
    fontWeight: "bold",
  },
  userInfoContainer: {
    marginLeft: 15,
  },
  greeting: {
    color: "#666",
    fontSize: 14,
  },
  userName: {
    color: "#333",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  headerBottomRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  weatherCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  weatherInfo: {
    color: "#666",
    fontSize: 14,
    marginLeft: 8,
  },
  actionPromptContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  actionPromptText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  ctaContainer: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  ctaCardOrange: {
    backgroundColor: "#FF8C00",
    borderColor: "#FF8C00",
  },
  ctaText: {
    marginLeft: 15,
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  ctaTextWhite: {
    color: "#FFFFFF",
  },
  quickAccessContainer: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  quickAccessGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAccessItem: {
    alignItems: "center",
  },
  quickAccessIconContainer: {
    backgroundColor: "#F8F8F8",
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  quickAccessIconContainerBlue: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  exploreContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  exploreTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  exploreDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: "#FF8C00",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
