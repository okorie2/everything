import React, { useState } from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CalculatorScreen = () => {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState({
    value: "",
    display: false,
  });
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  const [latestResult, setLatestResult] = useState(null);

  const handleEquationHolder = (newVal, display) => {
    if (latestResult) {
      setEquation({
        display,
        value: latestResult + newVal,
      });
      setLatestResult(null);
    } else {
      setEquation((prev) => ({
        display: false,
        value: prev.value + newVal,
      }));
    }
  };
  const handleNumber = (num) => {
    handleEquationHolder(num, false);
    if (display === "0" || shouldResetDisplay) {
      setDisplay(num.toString());
      setShouldResetDisplay(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op) => {
    handleEquationHolder(op, false);

    setShouldResetDisplay(true);
  };

  const handleEqual = () => {
    setEquation((prev) => ({
      ...prev,
      display: true,
    }));
    try {
      // Replace × and ÷ with * and / for evaluation
      const evalReady = equation.value.replace(/×/g, "*").replace(/÷/g, "/");

      const result = new Function(`return ${evalReady}`)();
      setLatestResult(result);
      setDisplay(result.toString());
    } catch (error) {
      setDisplay("Error");
    }
    setShouldResetDisplay(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setLatestResult(null);
    setEquation((prev) => ({
      value: "",
      display: true,
    }));
    setShouldResetDisplay(true);
  };

  const renderButton = (
    text,
    onPress,
    buttonStyle,
    textStyle
  ) => (
    <TouchableOpacity style={[styles.button, buttonStyle]} onPress={onPress}>
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Display */}
      <View style={styles.display}>
        <Text style={styles.equation}>
          {equation.display && equation.value}
        </Text>
        <Text style={styles.result}>{display}</Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {/* First row */}
        <View style={styles.row}>
          {renderButton(
            "C",
            handleClear,
            styles.clearButton,
            styles.specialButtonText
          )}
          {renderButton(
            "÷",
            () => handleOperator("÷"),
            styles.operatorButton,
            styles.specialButtonText
          )}
        </View>

        {/* Number rows */}
        <View style={styles.row}>
          {renderButton(
            "7",
            () => handleNumber(7),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "8",
            () => handleNumber(8),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "9",
            () => handleNumber(9),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "×",
            () => handleOperator("×"),
            styles.operatorButton,
            styles.specialButtonText
          )}
        </View>

        <View style={styles.row}>
          {renderButton(
            "4",
            () => handleNumber(4),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "5",
            () => handleNumber(5),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "6",
            () => handleNumber(6),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "-",
            () => handleOperator("-"),
            styles.operatorButton,
            styles.specialButtonText
          )}
        </View>

        <View style={styles.row}>
          {renderButton(
            "1",
            () => handleNumber(1),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "2",
            () => handleNumber(2),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "3",
            () => handleNumber(3),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "+",
            () => handleOperator("+"),
            styles.operatorButton,
            styles.specialButtonText
          )}
        </View>

        <View style={styles.row}>
          {renderButton(
            "0",
            () => handleNumber(0),
            styles.zeroButton,
            styles.buttonText
          )}
          {renderButton(
            ".",
            () => handleNumber(0),
            styles.button,
            styles.buttonText
          )}
          {renderButton(
            "=",
            handleEqual,
            styles.equalButton,
            styles.specialButtonText
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 20,
    width: "100%",
    maxWidth: 350,
  },
  display: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  equation: {
    fontSize: 16,
    color: "#666",
    height: 20,
  },
  result: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "right",
  },
  keypad: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 24,
    color: "#333",
  },
  operatorButton: {
    backgroundColor: "#007AFF",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
    flex: 3,
    marginRight: 10,
  },
  equalButton: {
    backgroundColor: "#34C759",
  },
  zeroButton: {
    flex: 2,
    marginRight: 10,
  },
  specialButtonText: {
    color: "white",
  },
});

export default CalculatorScreen;
