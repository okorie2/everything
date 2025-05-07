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
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../backend/firebase"; // adjust path
import { Ionicons } from "@expo/vector-icons"; // Make sure to install expo/vector-icons
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get("window");

// Define theme colors for consistency
const COLORS = {
  primary: "#FF8008", // Orange - active primary
  secondary: "#1a2a6c", // Deep blue
  background: "#f5f8fa",
  card: "#ffffff",
  text: "#333333",
  textLight: "#767676",
  border: "#f0f0f0",
};

const BusinessListScreen = ({ navigation }) => {
  const [businesses, setBusinesses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const auth = getAuth();

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const uid = getAuth().currentUser?.uid || "";

      // 1) All approved businesses
      const approvedQ = query(
        collection(db, "businesses"),
        where("status", "==", "approved")
      );
      const approvedSnap = await getDocs(approvedQ);
      const approved = approvedSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // 2) My own businesses (pending or approved)
      let mine = [];
      if (uid) {
        const mineQ = query(
          collection(db, "businesses"),
          where("owner_id", "==", uid)
        );
        const mineSnap = await getDocs(mineQ);
        mine = mineSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

      const merged = [...approved, ...mine].filter(
        (b) => b.name !== "Bethel City Hospital"
      );
      setBusinesses(merged);
      setFiltered(merged);
    } catch (err) {
      console.error("BUSINESS QUERY ERROR →", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
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

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              activeFilter === category && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange(category)}
          >
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("BusinessDetail", { business: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.businessIcon}>
          <Text style={styles.businessInitial}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.businessInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.categoryContainer}>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#ccc" />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color="#666"
            style={styles.infoIcon}
          />
          <Text style={styles.address} numberOfLines={1}>
            {item.address}
          </Text>
        </View>

        {item.contact_info && (
          <View style={styles.infoRow}>
            <Ionicons
              name="call-outline"
              size={16}
              color="#666"
              style={styles.infoIcon}
            />
            <Text style={styles.contactInfo}>{item.contact_info.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="share-social-outline"
            size={18}
            color={COLORS.secondary}
          />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.contactButton]}
          onPress={() =>
            navigation.navigate("BusinessDetail", {
              business: item,
              initialTab: "contact",
            })
          }
        >
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="business-outline" size={60} color="#ddd" />
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
      >
        <Text style={styles.resetButtonText}>Reset Filters</Text>
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading businesses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backButton}
            onPress={handleGoBack}
            android_ripple={{ color: "rgba(26,42,108,0.1)", borderless: true }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.secondary} />
          </Pressable>
          <Text style={styles.title}>Explore Businesses</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("RegisterBusiness")}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search businesses..."
          placeholderTextColor="#999"
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
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
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
      />
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(26,42,108,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterScroll: {
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeFilterButton: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f7",
  },
  businessIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFE0C2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  businessInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  businessInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: {
    fontSize: 13,
    color: "#666",
    backgroundColor: "#f5f7fa",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  address: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  contactInfo: {
    fontSize: 14,
    color: "#666",
  },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f5f5f7",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    padding: 5,
  },
  actionText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  contactButton: {
    marginLeft: "auto",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  resetButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
