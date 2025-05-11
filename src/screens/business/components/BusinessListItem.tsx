import React from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/BusinessListStyle";

export const BusinessListItem = ({
  item,
  index,
  getCategoryColor,
  getCategoryIcon,
  navigation,
}) => {
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
            <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
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
              <Text style={styles.contactInfo}>{item.contact_info.phone}</Text>
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
            <Ionicons
              name="call-outline"
              size={16}
              color="#fff"
              style={styles.contactIcon}
            />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: COLORS.secondary, // The blue color (#1A73E8)
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contactIcon: {
    marginRight: 6,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
