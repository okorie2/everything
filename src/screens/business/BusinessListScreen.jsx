import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../backend/firebase";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COLORS,
  businessListStyles as styles,
} from "./styles/BusinessListStyle";
import BusinessExplorerHeader from "./components/BusinessExploreHeader";
import { BusinessCategoryFilter } from "./components/BusinessCategoryFilter";
import { BusinessListItem } from "./components/BusinessListItem";

const BusinessListScreen = ({ navigation, route }) => {
  const initialFilter = route?.params?.initialFilter || "All";
  const [businesses, setBusinesses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState("approved");
  const [scrollY] = useState(new Animated.Value(0));

  const auth = getAuth();

  // Simplified fetch function
  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid || "";

      // Get businesses with the current viewMode status
      const statusQuery = query(
        collection(db, "businesses"),
        where("status", "==", viewMode)
      );
      const statusSnap = await getDocs(statusQuery);

      // Get user's own businesses with the current viewMode
      const userQuery = uid
        ? query(
            collection(db, "businesses"),
            where("owner_id", "==", uid),
            where("status", "==", viewMode)
          )
        : null;

      const userSnap = userQuery ? await getDocs(userQuery) : null;

      // Combine and deduplicate results
      const allBusinesses = [];

      statusSnap.docs.forEach((doc) => {
        if (doc.data().name !== "Bethel City Hospital") {
          allBusinesses.push({
            id: doc.id,
            docId: doc.id,
            ...doc.data(),
          });
        }
      });

      if (userSnap) {
        userSnap.docs.forEach((doc) => {
          if (
            doc.data().name !== "Bethel City Hospital" &&
            !allBusinesses.some((b) => b.docId === doc.id)
          ) {
            allBusinesses.push({
              id: doc.id,
              docId: doc.id,
              ...doc.data(),
            });
          }
        });
      }

      setBusinesses(allBusinesses);
      applyFilters(allBusinesses, search, activeFilter);
    } catch (err) {
      console.error("BUSINESS QUERY ERROR →", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewMode, search, activeFilter, auth.currentUser]);

  // Simplified filter function
  const applyFilters = (data, searchText, categoryFilter) => {
    let result = [...data];

    if (searchText) {
      result = result.filter((business) =>
        business.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (categoryFilter !== "All") {
      result = result.filter(
        (business) => business.category === categoryFilter
      );
    }

    setFiltered(result);
  };

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDoc = await getDoc(doc(db, "user", uid));
      if (userDoc.exists()) {
        setIsAdmin(!!userDoc.data().isAdmin);
      }
    };

    checkAdminStatus();
  }, [auth.currentUser]);

  // Fetch businesses when component mounts or when viewMode changes
  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses, viewMode]);

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(businesses, text, activeFilter);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(businesses, search, filter);
  };

  const resetFilters = () => {
    setSearch("");
    setActiveFilter("All");
    setFiltered(businesses);
  };

  // Animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [
      Platform.OS === "ios" ? 140 : 130,
      Platform.OS === "ios" ? 100 : 90,
    ],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="business-outline"
        size={70}
        color={COLORS.textUltraLight}
      />
      <Text style={styles.emptyText}>No businesses found</Text>
      <Text style={styles.emptySubText}>
        Try a different search term or filter
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetFilters}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.secondary, COLORS.secondaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.resetGradient}
        >
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get unique categories from businesses
  const categories = [
    "All",
    ...Array.from(new Set(businesses.map((b) => b.category))),
  ];
  // Move "Food and Confectionery" to the end of the categories list
  const sortedCategories = categories.filter(
    (c) => c !== "Food and Confectionery"
  );
  if (categories.includes("Food and Confectionery")) {
    sortedCategories.push("Food and Confectionery");
  }
  console.log("Categories:", categories);

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <BusinessExplorerHeader
        navigation={navigation}
        COLORS={COLORS}
        activeFilter={activeFilter}
        handleGoBack={() => navigation.goBack()}
        handleSearch={handleSearch}
        search={search}
        setSearch={setSearch}
        headerHeight={headerHeight}
        headerOpacity={headerOpacity}
      />

      <View style={{ height:150 }} />

      {isAdmin && (
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              viewMode === "approved" && styles.tabButtonActive,
            ]}
            onPress={() => setViewMode("approved")}
          >
            <Text
              style={[
                styles.tabButtonText,
                viewMode === "approved" && styles.tabButtonTextActive,
              ]}
            >
              Approved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              viewMode === "pending_approval" && styles.tabButtonActive,
            ]}
            onPress={() => setViewMode("pending_approval")}
          >
            <Text
              style={[
                styles.tabButtonText,
                viewMode === "pending_approval" && styles.tabButtonTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <BusinessCategoryFilter
        COLORS={COLORS}
        activeFilter={activeFilter}
        categories={sortedCategories}
        getCategoryIcon={(category) =>
          CATEGORY_ICONS[category] || CATEGORY_ICONS.default
        }
        handleFilterChange={handleFilterChange}
      />

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <BusinessListItem
            item={item}
            index={index}
            getCategoryColor={(category) =>
              CATEGORY_COLORS[category] || CATEGORY_COLORS.default
            }
            getCategoryIcon={(category) =>
              CATEGORY_ICONS[category] || CATEGORY_ICONS.default
            }
            navigation={navigation}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          filtered.length === 0 && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBusinesses}
            colors={[COLORS.primary, COLORS.secondary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("RegisterBusiness")}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default BusinessListScreen;
