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
import { auth } from '../../../backend/firebase'; // Import your Firebase config
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useValidateForm } from '../../hooks/useValidateForm'; // Custom hook for form validation
import {storeLocalData} from '../../util/localStorage'; // Import your local storage utility

const LoginScreen = ({ navigation }) => {
 const [formDetails, setFormDetails] = useState({
    email: '',
    password: '',
  });
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { height } = Dimensions.get('window');
  const headerHeight = height * 0.35; // 35% of screen height

const { validateForm } = useValidateForm(formDetails, setErrors);

const handleLogin = async () => {
    const isValid = validateForm()
    if (!isValid) return;
    setLoading(true);
    try {
 await signInWithEmailAndPassword(auth, formDetails.email, formDetails.password);
    setLoading(false);
      
      // Check if email is verified
      if (!user.emailVerified) {
        Alert.alert(
          'Email Verification Required',
          'Please verify your email address to continue.',
        )
        navigation.navigate('EmailVerification');
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials.'; 
      setErrors({ auth: errorMessage });
    } finally {
      setLoading(false);
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
            {/* Logo placeholder */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>B</Text>
              </View>
              <Text style={styles.appName}>BETHEL CITY</Text>
            </View>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSubtitle}>
              Sign in to access Bethel City services
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Generic error message */}
            {errors.auth && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={20} color="#b21f1f" />
                <Text style={styles.authErrorText}>{errors.auth}</Text>
              </View>
            )}

            {/* Email Input */}
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
                value={formDetails}
                onChangeText={(e)=>{
                  setFormDetails({ ...formDetails, email: e });
                  setErrors({ ...errors, email: null });
                }}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Icon
                name="lock"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={secureTextEntry}
                value={formDetails.password}
                onChangeText={(e)=>{
                  setFormDetails({ ...formDetails, password: e });
                  setErrors({ ...errors, password: null });
                }
                }
                textContentType="password"
              />
              <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                <Icon
                  name={secureTextEntry ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPasswordLink}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Link */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account?{" "}
                <Text style={styles.registerLinkTextBold}>Create Account</Text>
              </Text>
            </TouchableOpacity>
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
    minHeight: '65%', // Ensure content takes at least 65% of screen height
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  authErrorText: {
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
  errorText: {
    color: "#b21f1f",
    fontSize: 14,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 10,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#1a2a6c",
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: "#1a2a6c",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },

  registerLink: {
    alignItems: "center",
    marginTop: 10,
  },
  registerLinkText: {
    color: "#666",
    fontSize: 16,
  },
  registerLinkTextBold: {
    fontWeight: "bold",
    color: "#1a2a6c",
  },
});

export default LoginScreen;