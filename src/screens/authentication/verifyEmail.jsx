// screens/EmailVerificationScreen.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { sendEmailVerification, getAuth } from "firebase/auth";

const EmailVerificationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Check verification status periodically
  useEffect(() => {
    if (!currentUser) {
      navigation.replace("Login");
      return;
    }

    const checkVerification = setInterval(() => {
      if (currentUser.emailVerified) {
        clearInterval(checkVerification);
        // navigation.replace("Home");
      }
    }, 3000);

    return () => clearInterval(checkVerification);
  }, [currentUser, navigation]);

  // Handle countdown timer for resend button
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendVerificationEmail = async () => {
    if (loading || timer > 0) return;

    setLoading(true);
    try {
      await sendEmailVerification(currentUser);
      setVerificationSent(true);
      setTimer(60); // 60 second cooldown
    } catch (error) {
      console.error("Error sending verification email:", error);
      Alert.alert("Error sending verification email" + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroContent}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Landing");
          }}
        >
          <Text style={styles.cityName}>BETHEL</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>One City. One App.</Text>
        <Text style={styles.heroSubtitle}>
          Mayor Dr. Emmanuel's vision for a smarter, more connected community
        </Text>
      </View>
      <LinearGradient colors={["#ffffff", "#fff8f0"]} style={styles.header}>
        <Text style={styles.title}>Verify Your Email</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.message}>
            We've sent a verification email to:
          </Text>
          <Text style={styles.email}>{currentUser?.email || "your email"}</Text>

          {verificationSent && (
            <Text style={styles.successMessage}>
              ✓ Verification email sent successfully
            </Text>
          )}

          <Text style={styles.instructions}>
            Please check your inbox and click the verification link to activate
            your account.
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              (loading || timer > 0) && styles.buttonDisabled,
            ]}
            onPress={sendVerificationEmail}
            disabled={loading || timer > 0}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {timer > 0
                  ? `Resend in ${timer}s`
                  : "Resend Verification Email"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() =>
              currentUser.getIdToken(true).then(() => {
                // After token refresh, reload the user object
                return user.reload();
              })
            }
          >
            <Text style={styles.refreshButtonText}>I've verified my email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  heroContent: {
    alignItems: "center",
    padding: 20,

    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF8008",
  },
  cityName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 4,
    marginTop: 60,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  heroSubtitle: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  message: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
    textAlign: "center",
  },
  email: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  successMessage: {
    color: "#4CAF50",
    fontSize: 14,
    marginBottom: 15,
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#FF9800",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#FFB74D",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  refreshButton: {
    padding: 12,
  },
  refreshButtonText: {
    color: "#2196F3",
    fontSize: 16,
  },
});

export default EmailVerificationScreen;
