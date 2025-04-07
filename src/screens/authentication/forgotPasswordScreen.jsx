import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { height } = Dimensions.get('window');
  const headerHeight = height * 0.3; // 30% of screen height
  const auth = getAuth();

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setError('');
    
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      
      let errorMessage = 'Failed to send password reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account exists with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      
      setError(errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <View style={[styles.header, { height: headerHeight }]}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>B</Text>
              </View>
              <Text style={styles.appName}>BETHEL CITY</Text>
            </View>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>
              Enter your email to receive a password reset link
            </Text>
          </View>

          <View style={styles.formContainer}>
            {emailSent ? (
              <View style={styles.successContainer}>
                <View style={styles.iconCircle}>
                  <Icon name="email-check" size={40} color="#4CAF50" />
                </View>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successMessage}>
                  We've sent a password reset link to:
                </Text>
                <Text style={styles.emailText}>{email}</Text>
                <Text style={styles.instructionsText}>
                  Please check your inbox and follow the instructions in the email to reset your password.
                </Text>
                
                <TouchableOpacity
                  style={styles.backToLoginButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={20} color="#b21f1f" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputContainer}>
                  <Icon
                    name="email"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </View>

                <Text style={styles.infoText}>
                  Enter the email address associated with your account, and we'll send you a link to reset your password.
                </Text>

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => navigation.goBack()}
                >
                  <Icon name="arrow-left" size={20} color="#1a2a6c" />
                  <Text style={styles.backLinkText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
    backgroundColor: '#FF8008',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1a2a6c",
  },
  appName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 2,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  headerSubtitle: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
    flex: 1,
    minHeight: '70%', // Ensure content takes at least 70% of screen height
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#b21f1f',
    marginLeft: 10,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: "#1a2a6c",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  backLinkText: {
    color: "#1a2a6c",
    fontSize: 16,
    marginLeft: 5,
    fontWeight: '500',
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a2a6c',
    marginVertical: 10,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  backToLoginButton: {
    backgroundColor: "#1a2a6c",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backToLoginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ForgotPasswordScreen;