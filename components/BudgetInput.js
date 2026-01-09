import { View, Image, Text } from "react-native";
import React from "react";
import Slider from "@react-native-community/slider";

const BudgetInput = ({ budget, setBudget }) => {

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#BA93CA",
        borderRadius: 12,
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
              color: "#51225B",
            }}
          >
            What&apos;s your budget?
          </Text>
          <Text
            style={{
              fontFamily: "Montserrat-SemiBold",
              fontSize: 20,
              color: "#BA93CA",
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
        minimumTrackTintColor="#BA93CA"
        maximumTrackTintColor="#E8D5EE"
        thumbTintColor="#51225B"
      />
    </View>
  );
};

export default BudgetInput;
