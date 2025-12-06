import { View, TextInput } from "react-native";
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const SearchBar = () => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 2,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 12,
      }}
    >
      <FontAwesome name="search" size={22} color="gray" style={{ marginRight: 10 }} />
      <TextInput placeholder="What do you feel like cooking?" style={{ fontFamily: 'Montserrat-Regular' }} />
    </View>
  );
};

export default SearchBar;
