import { View, Image, Text } from "react-native";
import React from "react";
import Slider from "@react-native-community/slider";
import { useTheme } from "../theme/ThemeProvider";
import Entypo from '@expo/vector-icons/Entypo';

const BudgetInput = ({ budget, setBudget, servings, setServings }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.primary,
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
        style={{ width: "100%", height: 20, marginBottom: 8 }}
        minimumValue={100}
        maximumValue={1000}
        step={5}
        value={budget}
        onValueChange={setBudget}
        minimumTrackTintColor={theme.primarySoft}
        maximumTrackTintColor={theme.primarySoftAlt}
        thumbTintColor={theme.primary}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: 8 }}>
        <View>
          <Text style={{ fontFamily: "Montserrat-Bold", fontSize: 15, color: theme.primary }}>Servings</Text>
          <Text style={{ fontFamily: "Montserrat-SemiBold", fontSize: 12, color: theme.subtext }}>How many are eating?</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Entypo name="squared-minus" size={24} color={theme.primary} onPress={() => setServings(Math.max(1, (Number(servings) || 1) - 1))} />
          <Text style={{ fontFamily: "Montserrat-Bold", fontSize: 15, color: theme.text, textAlign: 'center' }}>{servings}</Text>
          <Entypo name="squared-plus" size={24} color={theme.primary} onPress={() => setServings((Number(servings) || 1) + 1)} /></View>
      </View>
    </View>
  );
};

export default BudgetInput;
