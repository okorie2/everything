import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CalculatorScreen from "./src/screens/calculatorScreen";
import AccountScreen from "./src/screens/profile/accountScreen";
import LoginScreen from "./src/screens/authentication/loginScreen";
import LandingPage from "./src/screens/landingScreen";
import HomeScreen from "./src/screens/dashboard/dashboardScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import TicTacToeScreen from "./src/screens/games/tictactoe";
import RockPaperScissorsScreen from "./src/screens/games/rockPaperScissors";
import GamesScreen from "./src/screens/games";
import NotesScreenContainer from "./src/screens/notesScreen";
import RegistrationScreen from "./src/screens/authentication/register";
import EmailVerificationScreen from "./src/screens/authentication/verifyEmail";
import ForgotPasswordScreen from "./src/screens/authentication/forgotPasswordScreen";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import RegisterBusinessScreen from "./src/screens/business/RegisterBusinessScreen"; // adjust if needed
import BusinessDetailScreen from "./src/screens/business/BusinessDetailScreen";
import BusinessListScreen from "./src/screens/business/BusinessListScreen"; // adjust if needed
import { StatusBar } from "react-native";
import ServiceNavigator from "./src/navigations/ServiceNavigator"; // adjust if needed
import CalendarScreen from "./src/screens/calendar/CalendarScreen";
import QueueDetailScreen from "./src/screens/hospital/QueueDetailScreen";
import ChatRoomScreen from "./src/screens/ChatRoomScreen"; // adjust if needed

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
        component={ChatRoomScreen}
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
      <Stack.Screen name="CityServices" component={ServiceNavigator} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="QueueDetail" component={QueueDetailScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator - checks auth status and routes accordingly
const RootNavigator = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const isAuthenticated = !!currentUser;
  const auth = getAuth();

  React.useEffect(() => {
    // if (!currentUser) return;
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, [auth.currentUser]);
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </>
  );
}
