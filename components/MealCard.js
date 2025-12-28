import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';

const MealCard = ({ item, index }) => {
    const router = useRouter();
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

    // Support both local require() and remote image URLs
    let imageSource = item.img;
    if (typeof item.img === 'string' && item.img.startsWith('http')) {
        imageSource = { uri: item.img };
    }

    return (
        <Animated.View style={{
            flex: 1,
            margin: 4,
            maxWidth: '50%',
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
        }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/screens/MealView', params: { ...item } })}
            >
                <View style={{ alignSelf: 'center' }}>
                    <Image source={imageSource} style={{ width: 166, height: 166, borderRadius: 8 }} />
                    <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, marginTop: 8, textAlign: 'left', letterSpacing: -0.4 }}>{item.name}</Text>
                    <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: '#666', marginVertical: 4, textAlign: 'left', maxWidth: 166, letterSpacing: -0.5 }} numberOfLines={3}>{item.desc}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default MealCard;
