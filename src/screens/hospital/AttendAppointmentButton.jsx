import React from "react";
import { TouchableOpacity, Text } from "react-native";

const AttendButton = ({ slotStart, slotEnd, isBooked, onAttend, style }) => {
  if (!isBooked) return null;

  const now = new Date();
  const isCurrentSlot = now >= slotStart && now < slotEnd;

  if (!isCurrentSlot) return null;

  const timeToEnd = (slotEnd - now) / (1000 * 60); // in minutes
  const isMissed = timeToEnd <= 10;
  const buttonLabel = isMissed ? "Missed" : "Attend";

  return (
    <TouchableOpacity
      style={[
        style.btn,
        buttonLabel === "Missed" ? style.btnMissed : style.btnAttend,
      ]}
      disabled={isMissed}
      onPress={() => {
        if (!isMissed && onAttend) onAttend();
      }}
    >
      <Text style={style.btnText}>{buttonLabel}</Text>
    </TouchableOpacity>
  );
};

export default AttendButton;
