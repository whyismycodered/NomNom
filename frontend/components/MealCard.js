import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';

const MealCard = ({ item, index, budget, onGenerate, cols = 2 }) => {
    const router = useRouter();
    const { theme } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    const isOutOfBudget = item.price > budget;
    const dimAnim = useRef(new Animated.Value(isOutOfBudget ? 1 : 0)).current;

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

    // Animate grey-out whenever budget changes
    useEffect(() => {
        Animated.timing(dimAnim, {
            toValue: isOutOfBudget ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [isOutOfBudget, budget, dimAnim]);

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
                    <Animated.View style={{
                        width: '100%',
                        opacity: dimAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
                        padding: 0,
                        margin: 0
                    }}>
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
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

export default MealCard;
