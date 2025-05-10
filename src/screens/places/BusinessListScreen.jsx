import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
  Pressable,
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
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

// Enhanced color palette based on #FF8008
const COLORS = {
  primary: "#FF8008", // Orange - active primary
  primaryLight: "#FFB266", // Lighter orange
  primaryDark: "#E06000", // Darker orange
  secondary: "#1a2a6c", // Deep blue
  secondaryLight: "#3F51B5", // Lighter blue
  background: "#F8FAFC", // Light background
  card: "#ffffff",
  text: "#2D3748", // Darker text for better contrast
  textLight: "#718096", // Light text
  textUltraLight: "#A0AEC0", // Ultra light text
  border: "#E2E8F0", // Light border
  shadow: "#111827", // Shadow color
  error: "#E53E3E", // Red for errors
  success: "#38A169", // Green for success
  warning: "#F6AD55", // Warning color
  highlight: "#FFF3E0", // Light orange highlight
  divider: "#EDF2F7", // Divider color
};

// Business category icons mapping
const CATEGORY_ICONS = {
  "Food & Drink": "restaurant",
  Shopping: "cart",
  Healthcare: "medical",
  Education: "school",
  Entertainment: "film",
  Services: "briefcase",
  Beauty: "cut",
  Fitness: "fitness",
  // Add more as needed
  default: "business", // Default icon
};

// Category background colors
const CATEGORY_COLORS = {
  "Food & Drink": "#FFE0B2",
  Shopping: "#BBDEFB",
  Healthcare: "#C8E6C9",
  Education: "#D1C4E9",
  Entertainment: "#FFCDD2",
  Services: "#CFD8DC",
  Beauty: "#F8BBD0",
  Fitness: "#B2EBF2",
  // Add more as needed
  default: "#E0E0E0",
};

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
        docId: d.id, // 🔥 real Firestore doc ID
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBusinesses();
  }, []);

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

    // Apply search filter
    if (searchText) {
      result = result.filter((b) =>
        b.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "All") {
      result = result.filter((b) => b.category === categoryFilter);
    }

    setFiltered(result);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Extract unique categories
  const categories = ["All", ...new Set(businesses.map((b) => b.category))];

  // Get icon for category
  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
  };

  // Get background color for category
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

  const renderCategoryFilter = () => (
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

  const renderItem = ({ item, index }) => {
    // Animation for staggered appearance
    const translateY = new Animated.Value(50);
    const opacity = new Animated.Value(0);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();

    const categoryColor = getCategoryColor(item.category);
    const categoryIcon = getCategoryIcon(item.category);

    return (
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY }],
        }}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate("BusinessDetail", { business: item })
          }
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View
              style={[styles.businessIcon, { backgroundColor: categoryColor }]}
            >
              <Ionicons name={categoryIcon} size={22} color={COLORS.primary} />
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.categoryContainer}>
                <Text
                  style={[
                    styles.category,
                    { backgroundColor: `${categoryColor}50` },
                  ]}
                >
                  {item.category}
                </Text>
                {item.rating && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFB400" />
                    <Text style={styles.ratingText}>
                      {item.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={COLORS.primary}
              />
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.textLight}
                style={styles.infoIcon}
              />
              <Text style={styles.address} numberOfLines={1}>
                {item.address || "No address provided"}
              </Text>
            </View>

            {item.contact_info && item.contact_info.phone && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={COLORS.textLight}
                  style={styles.infoIcon}
                />
                <Text style={styles.contactInfo}>
                  {item.contact_info.phone}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() =>
                navigation.navigate("BusinessDetail", {
                  business: item,
                  initialTab: "contact",
                })
              }
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.contactGradient}
              >
                <Ionicons
                  name="call-outline"
                  size={16}
                  color="#fff"
                  style={styles.contactIcon}
                />
                <Text style={styles.contactButtonText}>Contact</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Pressable
                style={styles.backButton}
                onPress={handleGoBack}
                android_ripple={{
                  color: "rgba(255,255,255,0.2)",
                  borderless: true,
                }}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </Pressable>
              <Text style={styles.title}>Explore Businesses</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("RegisterBusiness")}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

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
                style={styles.searchBar}
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

      {renderCategoryFilter()}

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 128, 8, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  header: {
    width: "100%",
    overflow: "hidden",
  },
  gradientHeader: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 0 : 30,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  addButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    display: "none",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: COLORS.text,
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    zIndex: 1,
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
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterIcon: {
    marginRight: 6,
  },
  activeFilterButton: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  businessIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  businessInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "85%",
  },
  category: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 3,
  },
  chevronContainer: {
    backgroundColor: "rgba(255, 128, 8, 0.1)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
    width: 18,
  },
  address: {
    fontSize: 14,
    color: COLORS.textLight,
    flex: 1,
  },
  contactInfo: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  contactButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  contactGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  contactIcon: {
    marginRight: 6,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    flex: 1,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 24,
    textAlign: "center",
  },
  resetButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  resetGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  tabToggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 16,
    marginVertical: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    position: "relative",
  },
  tabButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  badgeContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
});
