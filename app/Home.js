import { View, Text, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "../components/SearchBar";
import BudgetInput from "../components/BudgetInput";
import MealContainer from "../components/MealContainer";

export default function Home() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [budget, setBudget] = React.useState(200);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16 }}>Great to see you!</Text>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
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
        <MealContainer budget={budget} searchQuery={searchQuery} />
      </ScrollView>
    </SafeAreaView>
  );
}
