import { View, Text, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "../components/SearchBar";
import BudgetInput from "../components/BudgetInput";
import MealContainer from "../components/MealContainer";

export default function Home() {
  const [budget, setBudget] = React.useState(500);

  return (
    <SafeAreaView>
      <View style={{ padding: 16, gap: 16 }}>
        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16 }}>Great to see you!</Text>
        <SearchBar />
        <BudgetInput
          budget={budget}
          setBudget={setBudget}
        />
        <View>
          <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18 }}>
            Meals under{" "}
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: '#51225B' }}>₱{budget}</Text>
          </Text>
          <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: '#666' }}>
            Explore various food options tailored to your budget!
          </Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <MealContainer budget={budget} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
