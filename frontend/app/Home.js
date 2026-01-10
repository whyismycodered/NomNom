import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBar from "../components/SearchBar";
import BudgetInput from "../components/BudgetInput";
import MealContainer from "../components/MealContainer";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeProvider"; // Updated import path

export default function Home() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [budget, setBudget] = React.useState(200);
  const { theme, mode, toggle } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: theme.text }}>Great to see you!</Text>
          <TouchableOpacity onPress={toggle} accessibilityRole="button" accessibilityLabel="Toggle theme">
            <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <BudgetInput
          budget={budget}
          setBudget={setBudget}
        />
        <View>
          <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: theme.text }}>
            Meals under{" "}
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: theme.primary }}>₱{budget}</Text>
          </Text>
          <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: theme.subtext }}>
            Explore various food options tailored to your budget!
          </Text>
        </View>
        <MealContainer budget={budget} searchQuery={searchQuery} />
      </ScrollView>
    </SafeAreaView>
  );
}
