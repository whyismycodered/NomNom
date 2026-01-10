import { View, Image, Text } from "react-native";
import React from "react";
import Slider from "@react-native-community/slider";
import { useTheme } from "../theme/ThemeProvider";

const BudgetInput = ({ budget, setBudget }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        backgroundColor: theme.card,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <Image
          source={require("../assets/images/nomnom-budget.png")}
          style={{ width: 55, height: 55, marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Fredoka-SemiBold",
              fontSize: 18,
              color: theme.primary,
            }}
          >
            What&apos;s your budget?
          </Text>
          <Text
            style={{
              fontFamily: "Montserrat-SemiBold",
              fontSize: 20,
              color: theme.primarySoft,
              marginTop: 4,
            }}
          >
            ₱{budget}
          </Text>
        </View>
      </View>

      <Slider
        style={{ width: "100%", height: 20 }}
        minimumValue={100}
        maximumValue={1000}
        step={5}
        value={budget}
        onValueChange={setBudget}
        minimumTrackTintColor={theme.primarySoft}
        maximumTrackTintColor={theme.primarySoftAlt}
        thumbTintColor={theme.primary}
      />
    </View>
  );
};

export default BudgetInput;
