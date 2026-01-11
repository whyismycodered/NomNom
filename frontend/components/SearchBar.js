import { View, TextInput, TouchableOpacity } from "react-native";
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeProvider";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const { theme } = useTheme();

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 2,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        backgroundColor: theme.card,
      }}
    >
      <FontAwesome name="search" size={22} color={theme.subtext} style={{ marginRight: 10 }} />
      <TextInput
        placeholder="Search recipes by name..."
        style={{ fontFamily: 'Montserrat-Regular', flex: 1, color: theme.text }}
        placeholderTextColor={theme.subtext}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={clearSearch} style={{ marginLeft: 8 }}>
          <Ionicons name="close-circle" size={20} color={theme.subtext} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
