import { View, Text } from 'react-native'

export default function BudgetBadge({ budget }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 16, borderColor: '#8B00C4', borderWidth: 1, backgroundColor: '#FFFFFF' }}>
      <Text>Meals under {" "}</Text>
      <Text style={{ fontFamily: "Montserrat-SemiBold", color: "#8B00C4" }}>{budget}</Text>
    </View>
  )
}