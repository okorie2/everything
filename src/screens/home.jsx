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
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../backend/firebase";
import { getPartOfDay } from "../util/helper";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  // User data state
  const [userData, setUserData] = useState({
    name: "User",
    profileImage: null,
  });

  // Quick actions
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
    { title: "City Services", icon: "city", screen: "Services" },
  ];

  // App statistics
  const appStats = [
    { number: "5", label: "Bookings" },
    { number: "3", label: "Applications" },
    { number: "2", label: "Visits" },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, "user", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData((prev) => ({
              ...prev,
              name: data.first_name || "User",
              profileImage: data.profileImage || null,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with greeting */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>
                  Hey, Good {getPartOfDay()} !
                </Text>
                <Text style={styles.userName}>{userData.name}</Text>
                <Text style={styles.weatherInfo}>
                  It's a Bright day in Bethel City
                </Text>
              </View>
              {/* <TouchableOpacity 
                style={styles.profileImageContainer}
              >
                {userData.profileImage ? (
                  <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileInitials}>
                    <Text style={styles.initialsText}>{userData.name.charAt(0)}</Text>
                  </View>
                )}
              </TouchableOpacity> */}
            </View>

            <View style={styles.notificationIcon}>
              <TouchableOpacity>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* What would you like to do today? */}
          <View style={styles.actionPromptContainer}>
            <Text style={styles.actionPromptText}>
              What would you like to do today?
            </Text>
          </View>

          {/* Quick actions - CTA Cards */}
          <View style={styles.ctaContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
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

          {/* Quick access section */}
          <View style={styles.quickAccessContainer}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity style={styles.quickAccessItem}>
                <View style={styles.quickAccessIconContainer}>
                  <MaterialCommunityIcons name="bus" size={24} color="#fff" />
                </View>
                <Text style={styles.quickAccessText}>Transport</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessItem}>
                <View style={styles.quickAccessIconContainer}>
                  <MaterialCommunityIcons name="food" size={24} color="#fff" />
                </View>
                <Text style={styles.quickAccessText}>Food</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessItem}>
                <View style={styles.quickAccessIconContainer}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={24}
                    color="#fff"
                  />
                </View>
                <Text style={styles.quickAccessText}>Health</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessItem}>
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

          {/* App statistics */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              {appStats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Explore Section */}
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    position: "relative",
    backgroundColor: "#FF8008",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
  },
  weatherInfo: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.85,
    marginTop: 5,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fdbb2d",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1D4ED8",
  },
  notificationIcon: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  actionPromptContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginTop: -20,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  actionPromptText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1D4ED8",
  },
  ctaContainer: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  ctaCard: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaText: {
    fontSize: 17,
    color: "#1D4ED8",
    fontWeight: "600",
    marginLeft: 15,
  },
  quickAccessContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D4ED8",
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
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FF8008",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  statsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    width: "30%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF8008",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  exploreContainer: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  exploreTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  exploreDescription: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.9,
  },
  exploreButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: "#1D4ED8",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default HomeScreen;
