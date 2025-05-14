import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../backend/firebase";

const HOSPITAL_ID = "bethel-hospital";

export default function ClinicListScreen({ navigation }) {
  const [clinics, setClinics] = useState(null);
  const [filteredClinics, setFilteredClinics] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchClinics = async () => {
    try {
      setIsLoading(true);
      const snap = await getDocs(
        collection(db, "businesses", HOSPITAL_ID, "clinics")
      );
      const clinicData = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Adding mock data for enhanced UI
        distance: (Math.random() * 5).toFixed(1),
        waitTime: Math.floor(Math.random() * 60),
        rating: (Math.random() * 2 + 3).toFixed(1),
        phone: "123-456-7890",
        address: "123 Medical Dr, Suite " + Math.floor(Math.random() * 100),
      }));
      setClinics(clinicData);
      setFilteredClinics(clinicData);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterClinics = () => {
    if (!searchQuery.trim()) {
      setFilteredClinics(clinics);
      return;
    }

    const filtered = clinics.filter(
      (clinic) =>
        clinic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClinics(filtered);
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (clinics) {
      filterClinics();
    }
  }, [searchQuery, clinics]);

  console.log(filteredClinics, "filteredClinics");

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        {/* <ArrowLeft size={24} color="#1a2a6c" /> */}
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Bethel Hospital</Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      {/* <Search size={20} color="#64748b" /> */}
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search clinics by name or specialty..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );

  const renderClinicCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("Slots", {
          clinicId: item.id,
          clinicTitle: item.title,
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.ratingStars}>★★★★★</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.divider} />

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            {/* <MapPin size={16} color="#64748b" /> */}
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{item.distance} miles</Text>
          </View>
          <View style={styles.infoItem}>
            {/* <Clock size={16} color="#64748b" /> */}
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoText}>
              {item.waitTime === 0 ? "No wait" : `~${item.waitTime} min wait`}
            </Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            {/* <Phone size={16} color="#64748b" /> */}
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>
          <View style={styles.addressItem}>
            <Text style={styles.infoIcon}>🏢</Text>
            <Text style={styles.infoText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.chevronContainer}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No clinics found</Text>
      <Text style={styles.emptyDesc}>
        Try adjusting your search or check back later for more options
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a2a6c" />
        <Text style={styles.loadingText}>Finding available clinics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <View style={styles.wrapper}>
        <Text style={styles.title}>Choose a Clinic</Text>
        <Text style={styles.subtitle}>
          Select from our specialized clinics to book your appointment
        </Text>

        {renderSearchBar()}

        <FlatList
          data={filteredClinics}
          keyExtractor={(i) => i.id}
          renderItem={renderClinicCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wrapper: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: "#1a2a6c",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a2a6c",
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    color: "#1a2a6c",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#334155",
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: "row",
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2a6c",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontWeight: "700",
    color: "#1a2a6c",
    marginRight: 4,
  },
  ratingStars: {
    color: "#f59e0b",
    fontSize: 12,
  },
  cardDesc: {
    color: "#475569",
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 8,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  infoText: {
    color: "#64748b",
    fontSize: 14,
  },
  chevronContainer: {
    justifyContent: "center",
    paddingRight: 16,
  },
  chevron: {
    fontSize: 24,
    color: "#94a3b8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});
