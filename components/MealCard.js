import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeProvider';

const MealCard = ({ item, index, budget, onGenerate, cols = 2 }) => {
    const router = useRouter();
    const { theme } = useTheme();
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
    }, [fadeAnim, scaleAnim, index]);

    const isOutOfBudget = item.price > budget;
    // Support both local require() and remote image URLs
    let imageSource = item.img;
    if (typeof item.img === 'string' && item.img.startsWith('http')) {
        imageSource = { uri: item.img };
    }

    return (
        <Animated.View style={{
            width: `${100 / cols}%`,
            padding: 6,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
        }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    const ingredientsStr = Array.isArray(item.ingredients)
                        ? item.ingredients.join('\n')
                        : (item.ingredients || '');
                    const proceduresStr = Array.isArray(item.procedures)
                        ? item.procedures.join('\n')
                        : (item.procedures || '');
                    router.push({
                        pathname: '/screens/MealView',
                        params: {
                            name: item.name,
                            desc: item.desc,
                            imgKey: item.imgKey,
                            ingredients: ingredientsStr,
                            procedures: proceduresStr,
                        }
                    })
                }}
            >
                <View style={{ alignSelf: 'stretch', opacity: isOutOfBudget ? 0.45 : 1 }}>
                    <Image source={imageSource} style={{ width: '100%', aspectRatio: 1, borderRadius: 8 }} />
                    <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, marginTop: 8, textAlign: 'left', letterSpacing: -0.4, color: theme.text }}>{item.name}</Text>
                    <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: theme.subtext, marginVertical: 4, textAlign: 'left', letterSpacing: -0.5 }} numberOfLines={3}>{item.desc}</Text>
                </View>
            </TouchableOpacity>
            {isOutOfBudget && (
                <TouchableOpacity
                    onPress={onGenerate}
                    style={{
                        marginTop: 8,
                        backgroundColor: theme.primary,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        alignSelf: 'center'
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 12, color: 'white', width: '80%' }}>Generate Budget Version</Text>
                        <MaterialCommunityIcons name="star-four-points" size={20} color="white" />
                    </View>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

export default MealCard;
