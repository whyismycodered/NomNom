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

    const isOutOfBudget = item.price > budget;

    // Initial mount animation
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

    // Animate when budget status changes
    const prevIsOutOfBudget = useRef(isOutOfBudget);
    useEffect(() => {
        if (prevIsOutOfBudget.current !== isOutOfBudget) {
            // Animate scale and color when budget status changes
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.02,
                    duration: 210,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 210,
                    useNativeDriver: true,
                })
            ]).start();
            prevIsOutOfBudget.current = isOutOfBudget;
        }
    }, [isOutOfBudget, scaleAnim]);
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
            transform: [{ scale: scaleAnim }],
            flexShrink: 0,
        }}>
            <View
                style={{
                    borderRadius: 12,
                    backgroundColor: theme.card || theme.surface || '#fff',
                    overflow: 'hidden',
                    // iOS shadow
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    // Android elevation
                    elevation: 3,
                }}
            >
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
                                // Pass optional video metadata for display
                                videoUrl: item.videoUrl,
                                videoThumbnail: item.videoThumbnail,
                                videoTitle: item.videoTitle,
                                videoAuthor: item.videoAuthor,
                            }
                        })
                    }}
                >
                    <View style={{ width: '100%', opacity: isOutOfBudget ? 0.45 : 1, padding: 0, margin: 0 }}>
                        <Image
                            source={imageSource}
                            resizeMode="cover"
                            style={{
                                width: '100%',
                                height: undefined,
                                aspectRatio: 1,
                                borderTopLeftRadius: 12,
                                borderTopRightRadius: 12,
                                margin: 0,
                                padding: 0,
                                alignSelf: 'stretch',
                            }}
                        />
                        <View style={{ padding: 10, paddingTop: 10, margin: 0 }}>
                            <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, textAlign: 'left', letterSpacing: -0.4, color: theme.text }}>{item.name}</Text>
                            <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: theme.subtext, marginTop: 4, textAlign: 'left', letterSpacing: -0.5 }} numberOfLines={3}>{item.desc}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                {isOutOfBudget && (
                    <TouchableOpacity
                        onPress={onGenerate}
                        style={{
                            marginTop: 4,
                            marginHorizontal: 10,
                            marginBottom: 10,
                            backgroundColor: theme.primary,
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 10,
                            alignSelf: 'stretch'
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 12, color: 'white', width: '80%' }}>Generate Budget Version</Text>
                            <MaterialCommunityIcons name="star-four-points" size={18} color="white" />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

export default MealCard;
