import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Tooltip descriptions for each stat
const TOOLTIP_INFO = {
  bookings: "Total count of appointments booked through the app",
  applications: "Number of pending service applications you've submitted",
};

export default function StatsSection({ counts }) {
  // State to track which tooltip is visible (null means none are visible)
  const [visibleTooltip, setVisibleTooltip] = useState(null);
  // Animation value for tooltip fade in/out
  const [fadeAnim] = useState(new Animated.Value(0));

  // Toggle tooltip visibility
  const toggleTooltip = (tooltipName) => {
    if (visibleTooltip === tooltipName) {
      // Hide tooltip if the same one is clicked again
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setVisibleTooltip(null);
      });
    } else {
      // Show new tooltip
      setVisibleTooltip(tooltipName);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Your Activity</Text>
      <View style={styles.statsGrid}>
        <StatItem
          label="Bookings"
          value={counts.bookings}
          tooltipVisible={visibleTooltip === "bookings"}
          tooltipText={TOOLTIP_INFO.bookings}
          fadeAnim={fadeAnim}
          onInfoPress={() => toggleTooltip("bookings")}
        />
        <StatItem
          label="Applications"
          value={counts.applications}
          tooltipVisible={visibleTooltip === "applications"}
          tooltipText={TOOLTIP_INFO.applications}
          fadeAnim={fadeAnim}
          onInfoPress={() => toggleTooltip("applications")}
        />
      </View>
    </View>
  );
}

// Individual stat item component with tooltip
function StatItem({
  label,
  value,
  tooltipVisible,
  tooltipText,
  fadeAnim,
  onInfoPress,
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{value}</Text>
      <View style={styles.labelContainer}>
        <Text style={styles.statLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.infoIconButton}
          onPress={onInfoPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color="#FF8008"
          />
        </TouchableOpacity>
      </View>

      {tooltipVisible && (
        <Animated.View style={[styles.tooltip, { opacity: fadeAnim }]}>
          <View style={styles.tooltipArrow} />
          <Text style={styles.tooltipText}>{tooltipText}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#2D3748",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    width: (width - 80) / 3,
    alignItems: "center",
    position: "relative",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF8008",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoIconButton: {
    padding: 4,
    marginLeft: 2,
  },
  tooltip: {
    position: "absolute",
    bottom: -70,
    backgroundColor: "#333",
    borderRadius: 6,
    padding: 8,
    width: (width - 80) / 2,
    zIndex: 10,
    elevation: 5,
  },
  tooltipArrow: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -8,
    borderWidth: 4,
    borderColor: "transparent",
    borderBottomColor: "#333",
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
});
