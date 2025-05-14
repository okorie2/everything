import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClinicListScreen from "../screens/hospital/ClinicListScreen";
import SlotListScreen from "../screens/hospital/SlotListScreen";
import CityServicesScreen from "../screens/CityServicesScreen";

const Stack = createNativeStackNavigator();

export default function ServiceNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Clinics" component={CityServicesScreen} />
      <Stack.Screen name="Slots" component={SlotListScreen} />
    </Stack.Navigator>
  );
}
