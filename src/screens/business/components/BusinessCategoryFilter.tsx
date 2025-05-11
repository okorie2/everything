import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const BusinessCategoryFilter = ({
  categories,
  activeFilter,
  handleFilterChange,
  getCategoryIcon,
  COLORS,
}) => {
  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={`${category}-${index}`}
            style={[
              styles.filterButton,
              activeFilter === category && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange(category)}
            activeOpacity={0.8}
          >
            {category !== "All" && (
              <Ionicons
                name={getCategoryIcon(category)}
                size={16}
                color={activeFilter === category ? "#fff" : COLORS.secondary}
                style={styles.filterIcon}
              />
            )}
            <Text
              style={[
                styles.filterText,
                activeFilter === category && styles.activeFilterText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    paddingTop: 8, // Reduced padding top from 12 to 8
    paddingBottom: 4,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF", // Using explicit color instead of COLORS.background
    zIndex: 1,
    // Add a shadow to visually separate from the header
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -12, // Create an overlap with the header
  },
  filterScroll: {
    paddingBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEEEEE", // Using explicit color instead of COLORS.border
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterIcon: {
    marginRight: 6,
  },
  activeFilterButton: {
    backgroundColor: "#1A73E8", // Using the blue we selected earlier
    borderColor: "#1A73E8",
    shadowColor: "#1A73E8",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
  },
});
