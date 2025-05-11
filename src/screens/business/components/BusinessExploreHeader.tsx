import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const BusinessExplorerHeader = ({
  navigation,
  search,
  setSearch,
  filterData,
  activeFilter,
  headerHeight,
  headerOpacity,
  handleGoBack,
  handleSearch,
  COLORS,
}) => {
  return (
    <Animated.View
      style={[
        styles.header,
        {
          height: headerHeight,
          opacity: headerOpacity,
        },
      ]}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={styles.gradientHeader}
      >
        {/* Header Top Section */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.iconButton}
              onPress={handleGoBack}
              android_ripple={{
                color: "rgba(255,255,255,0.3)",
                borderless: true,
              }}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Explore Businesses</Text>
          </View>

          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.navigate("RegisterBusiness")}
            android_ripple={{
              color: "rgba(255,255,255,0.3)",
              borderless: true,
            }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search businesses..."
              placeholderTextColor={COLORS.textLight}
              style={styles.searchInput}
              value={search}
              onChangeText={handleSearch}
            />
            {search !== "" && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearch("");
                  filterData("", activeFilter);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  gradientHeader: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 48 : 40,
    paddingBottom: 32, // Increased padding to account for filter component overlap
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12, // Added bottom margin to create space below the search bar
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#333",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 6,
  },
});

export default BusinessExplorerHeader;
