import { StyleSheet, Platform, Dimensions } from "react-native";

// Enhanced color palette based on #FF8008

export const COLORS = {
  primary: "#FF8008",
  // Orange - active primary
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
export const CATEGORY_ICONS = {
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
export const CATEGORY_COLORS = {
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
const { width } = Dimensions.get("window");

export const businessListStyles = StyleSheet.create({
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

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
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
