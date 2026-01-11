import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchBar from "../components/SearchBar";
import BudgetInput from "../components/BudgetServingInput";
import MealContainer from "../components/MealContainer";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeProvider"; // Updated import path

export default function Home() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [budget, setBudget] = React.useState(200);
  const [servings, setServings] = React.useState(4);
  const [isLoading, setIsLoading] = React.useState(true);
  const { theme, mode, toggle } = useTheme();

  // Load saved budget and serving size on component mount
  React.useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const savedBudget = await AsyncStorage.getItem('userBudget');
        const savedServings = await AsyncStorage.getItem('userServings');
        
        if (savedBudget !== null) {
          setBudget(parseInt(savedBudget, 10));
        }
        
        if (savedServings !== null) {
          setServings(parseInt(savedServings, 10));
        }
      } catch (error) {
        console.warn('Failed to load user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPreferences();
  }, []);

  // Save budget when it changes
  const handleBudgetChange = React.useCallback(async (newBudget) => {
    setBudget(newBudget);
    try {
      await AsyncStorage.setItem('userBudget', newBudget.toString());
    } catch (error) {
      console.warn('Failed to save budget:', error);
    }
  }, []);

  // Save serving size when it changes
  const handleServingsChange = React.useCallback(async (newServings) => {
    setServings(newServings);
    try {
      await AsyncStorage.setItem('userServings', newServings.toString());
    } catch (error) {
      console.warn('Failed to save servings:', error);
    }
  }, []);

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
          setBudget={handleBudgetChange}
          servings={servings}
          setServings={handleServingsChange}
        />
        <View>
          <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: theme.text }}>
            Meals under{" "}
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: theme.primary }}>₱{budget}</Text>
            {" "}for{" "}
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: theme.primary }}>{servings}</Text>
            {" "}serving{servings !== 1 ? 's' : ''}
          </Text>
          <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: theme.subtext }}>
            Explore various food options tailored to your budget and serving size!
          </Text>
        </View>
        {!isLoading && (
          <MealContainer budget={budget} searchQuery={searchQuery} servings={servings} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
