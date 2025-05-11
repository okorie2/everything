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
import { db } from "../../../backend/firebase"; // adjust path
import { Ionicons } from "@expo/vector-icons"; // Make sure to install expo/vector-icons
import { getAuth } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COLORS,
  businessListStyles as styles,
} from "./styles/BusinessListStyle"; // adjust path
import BusinessExplorerHeader from "./components/BusinessExploreHeader";
import { BusinessCategoryFilter } from "./components/BusinessCategoryFilter";
import { BusinessListItem } from "./components/BusinessListItem";

const BusinessListScreen = ({ navigation, route }) => {
  const initialFilter = route?.params?.initialFilter || "All"; // Default to "All"
  const [businesses, setBusinesses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState("approved"); // 'approved' | 'pending'
  const [scrollY] = useState(new Animated.Value(0));

  const auth = getAuth();

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const uid = getAuth().currentUser?.uid || "";

      const conditions = [where("status", "==", viewMode)];
      const q = query(collection(db, "businesses"), ...conditions);
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: `${d.id}-list`,
        docId: d.id,
        ...d.data(),
      }));

      // If user owns businesses, include theirs too
      let mine = [];
      if (uid) {
        const mineQ = query(
          collection(db, "businesses"),
          where("owner_id", "==", uid),
          where("status", "==", viewMode)
        );

        const mineSnap = await getDocs(mineQ);
        mine = mineSnap.docs
          .map((d) => ({
            id: `${d.id}-mine`,
            docId: d.id,
            ...d.data(),
          }))
          .filter((b) => b.status === viewMode);
      }

      const mergedRaw = [...list, ...mine].filter(
        (b) => b.name !== "Bethel City Hospital"
      );

      const merged = Object.values(
        mergedRaw.reduce((acc, curr) => {
          acc[curr.docId] = curr;
          return acc;
        }, {})
      );
      setBusinesses(merged);

      // Apply active filter
      let filtered = merged;
      if (activeFilter !== "All") {
        filtered = filtered.filter((b) => b.category === activeFilter);
      }
      setFiltered(filtered);
    } catch (err) {
      console.error("BUSINESS QUERY ERROR →", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, "user", uid));
      if (snap.exists()) {
        setIsAdmin(!!snap.data().isAdmin);
      }
    };
    checkAdminStatus();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBusinesses();
  };

  const handleSearch = (text) => {
    setSearch(text);
    filterData(text, activeFilter);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    filterData(search, filter);
  };

  const filterData = (searchText, categoryFilter) => {
    let result = businesses;
    if (searchText) {
      result = result.filter((b) =>
        b.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (categoryFilter !== "All") {
      result = result.filter((b) => b.category === categoryFilter);
    }
    setFiltered(result);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const categories = ["All", ...new Set(businesses.map((b) => b.category))];

  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
  };

  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
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
        onPress={() => {
          setSearch("");
          setActiveFilter("All");
          setFiltered(businesses);
        }}
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

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <BusinessExplorerHeader
        navigation={navigation}
        COLORS={COLORS}
        activeFilter={activeFilter}
        filterData={filterData}
        handleGoBack={handleGoBack}
        handleSearch={handleSearch}
        search={search}
        setSearch={setSearch}
        headerHeight={headerHeight}
        headerOpacity={headerOpacity}
      />

      {isAdmin && (
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              viewMode === "approved" && styles.tabButtonActive,
            ]}
            onPress={() => {
              setViewMode("approved");
              fetchBusinesses();
            }}
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
            onPress={() => {
              setViewMode("pending_approval");
              fetchBusinesses();
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                viewMode === "pending_approval" && styles.tabButtonTextActive,
              ]}
            >
              Pending
            </Text>
            {viewMode !== "pending_approval" &&
              businesses.filter((b) => b.status === "pending_approval").length >
                0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {
                      businesses.filter((b) => b.status === "pending_approval")
                        .length
                    }
                  </Text>
                </View>
              )}
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 80 }} />

      <BusinessCategoryFilter
        COLORS={COLORS}
        activeFilter={activeFilter}
        categories={categories}
        getCategoryIcon={getCategoryIcon}
        handleFilterChange={handleFilterChange}
      />

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <BusinessListItem
            item={item}
            index={index}
            getCategoryColor={getCategoryColor}
            getCategoryIcon={getCategoryIcon}
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
            onRefresh={onRefresh}
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
