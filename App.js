import React from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CalculatorScreen from "./src/screens/calculatorScreen";
import AccountScreen from "./src/screens/accountScreen";
import LoginScreen from "./src/screens/authentication/loginScreen";
import LandingPage from "./src/screens/landingScreen";
import HomeScreen from "./src/screens/home";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import TicTacToeScreen from "./src/screens/games/tictactoe";
import RockPaperScissorsScreen from "./src/screens/games/rockPaperScissors";
import GamesScreen from "./src/screens/games";
import NotesScreenContainer from "./src/screens/notesScreen";
import RegistrationScreen from "./src/screens/authentication/register";
import EmailVerificationScreen from "./src/screens/authentication/verifyEmail";
import ForgotPasswordScreen from "./src/screens/authentication/forgotPasswordScreen";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./backend/firebase";
import RegisterBusinessScreen from "./src/screens/places/business/RegisterBusinessScreen"; // adjust if needed
import BusinessDetailScreen from "./src/screens/places/business/BusinessDetailScreen";

import BusinessListScreen from "./src/screens/places/BusinessListScreen"; // adjust if needed
// Placeholder screens (to be replaced with actual implementations)
const CalendarScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ fontSize: 20 }}>Calendar Screen</Text>
  </View>
);

const ChatScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ fontSize: 20 }}>Chat Screen</Text>
  </View>
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const BethelTab = createBottomTabNavigator();

const GamesStack = createNativeStackNavigator();

// Games Stack Navigator for navigating between games
const GamesNavigator = () => {
  return (
    <GamesStack.Navigator>
      <GamesStack.Screen
        name="Games"
        component={GamesScreen}
        options={{ headerShown: false }}
      />
      <GamesStack.Screen
        name="TicTacToe"
        component={TicTacToeScreen}
        options={{ title: "Tic Tac Toe" }}
      />
      <GamesStack.Screen
        name="RockPaperScissors"
        component={RockPaperScissorsScreen}
        options={{ title: "Rock Paper Scissors" }}
      />
    </GamesStack.Navigator>
  );
};

// Original tab navigator
const TabNavs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calculator" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreenContainer}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="note-text" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="gamepad-variant"
              color={color}
              size={26}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Bethel Navigator - new tab navigator with Home, Calendar, Chat, and Profile
const BethelNavigator = () => {
  return (
    <BethelTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#FF8008",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
        },
      }}
    >
      <BethelTab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
          headerShown: false,
        }}
      />
      <BethelTab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={26} />
          ),
        }}
      />
      <BethelTab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chat" color={color} size={26} />
          ),
        }}
      />
      <BethelTab.Screen
        name="ProfileTab"
        component={AccountScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" color={color} size={26} />
          ),
        }}
      />
    </BethelTab.Navigator>
  );
};

// Auth Navigator component - handles public routes
const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegistrationScreen} />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// App Navigator component - handles private routes
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={BethelNavigator} />
      <Stack.Screen name="Main" component={TabNavs} />
      <Stack.Screen
        name="RegisterBusiness"
        component={RegisterBusinessScreen}
      />
      <Stack.Screen name="BusinessList" component={BusinessListScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator - checks auth status and routes accordingly
const RootNavigator = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const isAuthenticated = !!currentUser;
  React.useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return <RootNavigator />;
}

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff'
//   }
// });
