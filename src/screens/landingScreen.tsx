import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CityIllustration } from "../../assets/bethel";

const { width } = Dimensions.get("window");

const LandingPage = ({ navigation }) => {
  const services = [
    {
      title: "Business Registration",
      icon: "store",
      description:
        "Register, renew and manage your business licenses in minutes.",
    },
    {
      title: "Healthcare Access",
      icon: "hospital-box",
      description: "Schedule appointments, access medical records, and more.",
    },
    {
      title: "City Services",
      icon: "office-building",
      description:
        "Vehicle registration, permits, and other municipal services.",
    },
    {
      title: "Community Engagement",
      icon: "account-group",
      description: "Stay informed about local events and provide feedback.",
    },
  ];

  return (
    <>
      {/* <StatusBar barStyle="light-content" /> */}
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <View style={styles.heroContent}>
              <Text style={styles.cityName}>BETHEL</Text>
              <Text style={styles.heroTitle}>One City. One App.</Text>
              <Text style={styles.heroSubtitle}>
                Mayor Dr. Emmanuel's vision for a smarter, more connected
                community
              </Text>
            </View>
            {/* <View>
            </View> */}
            <CityIllustration width="100%" height={180} />
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.heroButtonText}>Join us</Text>
            </TouchableOpacity>
          </View>

          {/* Vision Section */}
          <View style={styles.visionSection}>
            <Text style={styles.sectionTitle}>Mayor's Vision</Text>
            <View style={styles.visionContent}>
              <View style={styles.visionTextContainer}>
                <Text style={styles.visionText}>
                  "Our goal is to create a city where every service is
                  accessible through a single, user-friendly digital platform.
                  This initiative will streamline operations, enhance
                  communication, and foster a smarter, more sustainable urban
                  environment."
                </Text>
                <Text style={styles.mayorName}>
                  — Dr. Emmanuel, Mayor of Bethel
                </Text>
              </View>
            </View>
          </View>

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Everything in One Place</Text>
            <View style={styles.servicesGrid}>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <MaterialCommunityIcons
                    name="store"
                    color="#1a2a6c"
                    size={26}
                  />
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>
                    {service.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Benefits for Everyone</Text>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={30}
                color="#4CAF50"
              />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Streamlined Processes</Text>
                <Text style={styles.benefitDescription}>
                  Reduce bureaucracy and save time with simplified digital
                  services.
                </Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={30}
                color="#4CAF50"
              />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Enhanced Communication</Text>
                <Text style={styles.benefitDescription}>
                  Direct connection between citizens, businesses, and city
                  officials.
                </Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={30}
                color="#4CAF50"
              />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Sustainable Growth</Text>
                <Text style={styles.benefitDescription}>
                  Foster a thriving ecosystem for businesses and citizens alike.
                </Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={30}
                color="#4CAF50"
              />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Data-Driven Decisions</Text>
                <Text style={styles.benefitDescription}>
                  Improve city planning through real-time insights and
                  analytics.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} City of Bethel
            </Text>
          </View>
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
  heroContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF8008",
  },
  heroContent: {
    alignItems: "center",
  },
  cityName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  heroSubtitle: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  heroButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  heroButtonText: {
    color: "#1a2a6c",
    fontWeight: "bold",
    fontSize: 16,
  },

  visionSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    marginTop: -30,
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a2a6c",
    marginBottom: 20,
    textAlign: "center",
  },
  visionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  visionTextContainer: {
    flex: 1,
  },
  visionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    fontStyle: "italic",
  },
  mayorName: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "right",
  },
  servicesSection: {
    padding: 20,
    marginTop: 20,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    width: width / 2 - 30,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
    textAlign: "center",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  benefitsSection: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    marginTop: 20,
  },
  benefitItem: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  benefitTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  benefitDescription: {
    fontSize: 16,
    color: "#666",
  },

  footer: {
    padding: 20,
    backgroundColor: "#1a2a6c",
    alignItems: "center",
  },
  footerText: {
    color: "#ffffff",
    marginBottom: 15,
  },
});

export default LandingPage;
