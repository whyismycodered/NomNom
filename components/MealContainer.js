import { View, Text, Image, FlatList, TouchableOpacity, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'

const MealCard = ({ item, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                delay: index * 100,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <Animated.View style={{
            flex: 1,
            margin: 4,
            maxWidth: '50%',
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
        }}>
            <TouchableOpacity activeOpacity={0.7}>
                <View style={{ alignSelf: 'center' }}>
                    <Image source={item.img} style={{ width: 166, height: 166, borderRadius: 8 }} />
                    <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, marginTop: 8, textAlign: 'left', letterSpacing: -0.4 }}>{item.name}</Text>
                    <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: '#666', marginVertical: 4, textAlign: 'left', maxWidth: 166, letterSpacing: -0.5 }} numberOfLines={3}>{item.desc}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const MealContainer = ({ budget, searchQuery }) => {
    // Sample data
    const meals = [
        { id: 1, name: "Chicken Afritada", desc: "A classic Filipino chicken stew with potatoes, carrots, and bell peppers in a tomato-based sauce.", img: require("../assets/images/chicken-afritada.png"), price: 200 },
        { id: 2, name: "Fried Bangus", desc: "Crispy fried milkfish served with a side of vinegar dipping sauce.", img: require("../assets/images/fried-bangus.png"), price: 280 },
        { id: 3, name: "Pork Adobo", desc: "Tender pork marinated and simmered in soy sauce, vinegar, garlic, and spices.", img: require("../assets/images/pork-adobo.png"), price: 250 },
        { id: 4, name: "Beef Mechado", desc: "Beef stew cooked with tomatoes, potatoes, and carrots in a rich sauce.", img: require("../assets/images/beef-mechado.png"), price: 350 },
        { id: 5, name: "Lumpiang Shanghai", desc: "Crispy fried spring rolls filled with ground pork and vegetables.", img: require("../assets/images/lumpiang-shanghai.png"), price: 310 },
    ];

    const filteredMeals = meals.filter(meal =>
        meal.price <= budget &&
        meal.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderMeal = ({ item, index }) => <MealCard item={item} index={index} />;

    return (
        <FlatList
            data={filteredMeals}
            renderItem={renderMeal}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 8 }}
        />
    )
}

export default MealContainer