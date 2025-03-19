import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CalculatorScreen from "./src/screens/calculatorScreen";
import AccountScreen from "./src/screens/accountScreen";
import LoginScreen from "./src/screens/loginScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getLocalData, deleteData } from "./src/util/localStorage";
import { NavigationContainer } from "@react-navigation/native";
import TicTacToeScreen from "./src/screens/games/tictactoe";
import RockPaperScissorsScreen from "./src/screens/games/rockPaperScissors";
import GamesScreen from "./src/screens/games";   
import NotesScreenContainer from "./src/screens/notesScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
      {/* <GamesStack.Screen 
        name="DiceRolling" 
        component={DiceRollingScreen}
        options={{ title: "Dice Rolling" }}
      /> */}
    </GamesStack.Navigator>
  );
};

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
            <MaterialCommunityIcons name="gamepad-variant" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  // deleteData("username")

  const user = getLocalData("username");
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userD, setUserD] = React.useState({ isLoggedIn: false, username: "" });

  React.useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await getLocalData("username");
        console.log("checking login status", userData?.isLoggedin);
        setIsLoggedIn(userData?.isLoggedin || false);
        setUserD(userData);
      } catch (error) {
        console.error("Error checking login status", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Show a loading screen or return null while checking login status
  if (isLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
     
        <Stack.Navigator>
    
          <Stack.Screen name="Login" component={LoginScreen} />
  
          <Stack.Screen
            name="Main"
            component={TabNavs}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
 
    </NavigationContainer>
  );
}
