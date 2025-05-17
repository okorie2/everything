"use client";

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CustomDropdown = ({
  placeholder,
  options,
  value,
  onChange,
  iconName = "list-outline",
  error = null,
  fieldKey,
  setFocusedField,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const dropdownRef = useRef(null);
  const isFocused = fieldKey === setFocusedField;

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
      setFocusedField(null);
    } else {
      dropdownRef.current.measure((fx, fy, width, height, px, py) => {
        setDropdownTop(py + height);
        setDropdownLeft(px);
        setDropdownWidth(width);
      });
      setIsOpen(true);
      setFocusedField(fieldKey);
    }
  };

  const onItemSelect = (item) => {
    onChange(item);
    setIsOpen(false);
    setFocusedField(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isFocused && isOpen) {
      setIsOpen(false);
    }
  }, [isFocused]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => onItemSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item.label || item}</Text>
    </TouchableOpacity>
  );

  const selectedLabel = value
    ? options.find((item) =>
        typeof item === "object" ? item.value === value : item === value
      )?.label || value
    : "";

  return (
    <View style={styles.inputContainer}>
      {iconName && (
        <Text style={styles.inputIcon}>
          <Ionicons
            name={iconName}
            size={20}
            color={isFocused ? "#FF8008" : error ? "#f44336" : "#999"}
          />
        </Text>
      )}

      <TouchableOpacity
        ref={dropdownRef}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectedText,
            !selectedLabel && styles.placeholderText,
          ]}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color="#999"
          style={styles.arrowIcon}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              {
                top: dropdownTop,
                left: dropdownLeft,
                width: dropdownWidth,
              },
            ]}
          >
            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item, index) =>
                (typeof item === "object"
                  ? item.value.toString()
                  : item.toString()) + index
              }
              bounces={false}
              style={styles.dropdownList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingLeft: 40,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  inputFocused: {
    borderColor: "#FF8008",
    backgroundColor: "#FFFFFF",
    shadowColor: "#FF8008",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: "#f44336",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  selectedText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  arrowIcon: {
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownList: {
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default CustomDropdown;
