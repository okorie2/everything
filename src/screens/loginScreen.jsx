
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
} from "react-native";
import { users } from "../data";
import {storeLocalData} from "../util/localStorage";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = () => {
    if (!username || !newPassword) {
      alert("Please fill in all fields");
      return;
    }
    if (
      users.find(
        (user) =>
          user.username === username.toLocaleLowerCase() &&
          user.password === newPassword
      )
    ) {
      storeLocalData("username", {username, isLoggedIn: true});
      navigation.navigate("Main");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "/api/placeholder/100/100" }}
        style={styles.avatar}
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="username"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="password"
          keyboardType="default"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 30,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;
