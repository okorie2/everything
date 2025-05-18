import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AccountScreen from "./src/screens/profile/accountScreen";
import LoginScreen from "./src/screens/authentication/loginScreen";
import LandingPage from "./src/screens/landingScreen";
import HomeScreen from "./src/screens/dashboard/dashboardScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import RegistrationScreen from "./src/screens/authentication/register";
import ForgotPasswordScreen from "./src/screens/authentication/forgotPasswordScreen";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import RegisterBusinessScreen from "./src/screens/business/RegisterBusinessScreen";
import BusinessDetailScreen from "./src/screens/business/BusinessDetailScreen";
import BusinessListScreen from "./src/screens/business/BusinessListScreen";
import { StatusBar } from "react-native";
import ServiceNavigator from "./src/navigations/ServiceNavigator";
import CalendarScreen from "./src/screens/calendar/CalendarScreen";
import ChatRoomScreen from "./src/screens/chat/ChatRoomScreen";
import AppointmentSessionScreen from "./src/screens/hospital/AppointmentSession";
import PatientRecordScreen from "./src/screens/hospital/PatientRecordDetails";
import SlotListScreen from "./src/screens/hospital/SlotListScreen";

const Stack = createNativeStackNavigator();
const BethelTab = createBottomTabNavigator();

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
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// App Navigator component - handles private routes
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={BethelNavigator} />
      <Stack.Screen
        name="RegisterBusiness"
        component={RegisterBusinessScreen}
      />
      <Stack.Screen name="BusinessList" component={BusinessListScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <Stack.Screen
        name="PatientRecordDetails"
        component={PatientRecordScreen}
      />
      <Stack.Screen name="CityServices" component={ServiceNavigator} />
      <Stack.Screen name="BookAppointment" component={SlotListScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen
        name="AppointmentSession"
        component={AppointmentSessionScreen}
      />
    </Stack.Navigator>
  );
};

// Root Navigator - checks auth status and routes accordingly
const RootNavigator = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const isAuthenticated = !!currentUser;
  const auth = getAuth();

  React.useEffect(() => {
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
