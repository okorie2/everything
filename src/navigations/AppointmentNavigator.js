import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClinicListScreen from "../screens/hospital/ClinicListScreen";
import SlotListScreen from "../screens/hospital/SlotListScreen";

const Stack = createNativeStackNavigator();

export default function AppointmentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Clinics" component={ClinicListScreen} />
      <Stack.Screen name="Slots" component={SlotListScreen} />
    </Stack.Navigator>
  );
}
