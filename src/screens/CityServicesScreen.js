import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { db } from "../../backend/firebase"; // adjust path if needed

// Color scheme based on #FF8008
const COLORS = {
  primary: "#FF8008",
  secondary: "#FFA420",
  accent: "#FF5F6D",
  background: "#FAFAFA",
  card: "#FFFFFF",
  text: "#333333",
  subtext: "#777777",
  lightAccent: "#FFF3E0",
};

// Category icons mapping
const CATEGORY_ICONS = {
  "Food & Drink": "food-fork-drink",
  Shopping: "shopping",
  Healthcare: "hospital-box",
  Education: "school",
  Entertainment: "movie-open",
  Services: "briefcase",
  Beauty: "face-woman",
  Fitness: "dumbbell",
  // Add more categories as needed
  default: "store", // Default icon
};

export default function CityServicesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "businesses"));
      const counts = {};

      snap.docs.forEach((doc) => {
        const data = doc.data();
        const cat = data.category;
        if (!cat) return;

        if (!counts[cat]) counts[cat] = 0;
        counts[cat] += 1;
      });

      const list = Object.keys(counts).map((cat) => ({
        name: cat,
        count: counts[cat],
        icon: CATEGORY_ICONS[cat] || CATEGORY_ICONS.default,
      }));

      setCategories(list.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    };

    loadCategories();
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>City Services</Text>
        <Text style={styles.headerSubtitle}>
          Discover local businesses and services
        </Text>
      </LinearGradient>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.item,
        {
          backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.lightAccent,
          transform: [{ translateY: 0 }],
        },
      ]}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate("BusinessList", { initialFilter: item.name })
      }
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={item.icon}
          size={28}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.itemText}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.count}>
          {item.count} business{item.count !== 1 ? "es" : ""}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={COLORS.secondary}
      />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="store-search"
        size={64}
        color={COLORS.subtext}
      />
      <Text style={styles.emptyText}>No categories found</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.card,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.lightAccent,
    opacity: 0.9,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  item: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightAccent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemText: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  separator: {
    height: 8,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: "center",
  },
});
