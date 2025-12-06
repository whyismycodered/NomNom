import { View, Text, Image } from 'react-native'
import React from 'react'

const MealContainer = ({ budget }) => {
    // Sample data
    const meals = [
        { id: 1, name: "Chicken Afritada", desc: "A classic Filipino chicken stew with potatoes, carrots, and bell peppers in a tomato-based sauce.", img: require("../assets/images/chicken-afritada.png"), price: 300 },
        { id: 2, name: "Fried Bangus", desc: "Crispy fried milkfish served with a side of vinegar dipping sauce.", img: require("../assets/images/fried-bangus.png"), price: 380 },
        { id: 3, name: "Pork Adobo", desc: "Tender pork marinated and simmered in soy sauce, vinegar, garlic, and spices.", img: require("../assets/images/pork-adobo.png"), price: 250 },
        { id: 4, name: "Beef Mechado", desc: "Beef stew cooked with tomatoes, potatoes, and carrots in a rich sauce.", img: require("../assets/images/beef-mechado.png"), price: 450 },
        { id: 5, name: "Lumpiang Shanghai", desc: "Crispy fried spring rolls filled with ground pork and vegetables.", img: require("../assets/images/lumpiang-shanghai.png"), price: 490 },
    ];

  return (
        <View>
            {meals.map((meal) => (
              meal.price <= budget && (
                <View
                  key={meal.id}
                  style={{
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                  }}
                >
                <Image source={meal.img} style={{ width: 166, height: 166, borderRadius: 8 }} />
                  <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 16 }}>{meal.name}</Text>
                    <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: '#666', textAlign: 'center', marginVertical: 4 }}>{meal.desc}</Text>
                </View>
              )
            ))}
          </View>
  )
}

export default MealContainer