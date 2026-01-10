import { View, TextInput } from "react-native";
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "../theme/ThemeProvider";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const { theme } = useTheme();
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
        placeholder="What do you feel like cooking?"
        style={{ fontFamily: 'Montserrat-Regular', flex: 1, color: theme.text }}
        placeholderTextColor={theme.subtext}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );
};

export default SearchBar;
