import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Modern color scheme with orange as accent
const COLORS = {
  primary: "#FF8008",
  secondary: "#FFA420",
  background: "#FFFFFF",
  card: "#F8F9FA",
  text: "#2D3748",
  subtext: "#718096",
  lightAccent: "#FFF3E0",
  divider: "#E2E8F0",
};

// Service data structure
const CITY_SERVICES = [
  {
    id: "medical",
    name: "Medical Care",
    icon: "hospital-box",
    description: "Healthcare services for residents",
    subCategories: [
      {
        id: "General",
        name: "General Practice",
        icon: "doctor",
        description: "Primary healthcare services",
      },
      {
        id: "Pediatrics",
        name: "Pediatrics",
        icon: "baby-face-outline",
        description: "Healthcare for children and infants",
      },
    ],
  },
  {
    id: "bus",
    name: "Bus System",
    icon: "bus",
    description: "Public transportation network",
    subCategories: [],
  },
];
const HOSPITAL_ID = "bethel-hospital";

export default function CityServicesScreen({ navigation }) {
  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={["#FF8008", "#FFA420"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>City Services</Text>
            <Text style={styles.headerSubtitle}>
              Essential services for our community
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.7}
      onPress={() => {
        if (item.subCategories && item.subCategories.length > 0) {
          // Handle subcategories navigation or expansion
          navigation.navigate("Slots", {
            clinicId: item.id,
            clinicTitle: item.title,
          });
        } else {
          // Navigate to service details directly
          navigation.navigate("ServiceDetails", { service: item });
        }
      }}
    >
      <View style={styles.serviceIconContainer}>
        <MaterialCommunityIcons
          name={item.icon}
          size={28}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription}>{item.description}</Text>

        {item.subCategories && item.subCategories.length > 0 && (
          <View style={styles.subCategoriesContainer}>
            {item.subCategories.map((subCategory) => (
              <TouchableOpacity
                key={subCategory.id}
                style={styles.subCategoryItem}
                onPress={() =>
                  navigation.navigate("Slots", {
                    clinicId: item.id,
                    clinicTitle: item.title,
                  })
                }
              >
                <MaterialCommunityIcons
                  name={subCategory.icon}
                  size={18}
                  color={COLORS.primary}
                  style={styles.subCategoryIcon}
                />
                <Text style={styles.subCategoryName}>{subCategory.name}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={COLORS.subtext}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <FlatList
        data={CITY_SERVICES}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.background,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.background,
    opacity: 0.9,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.lightAccent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.subtext,
    marginBottom: 12,
  },
  subCategoriesContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 8,
  },
  subCategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  subCategoryIcon: {
    marginRight: 8,
  },
  subCategoryName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  separator: {
    height: 16,
  },
});
