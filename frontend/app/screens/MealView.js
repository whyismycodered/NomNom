import React, { useState, useEffect } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, View, Image, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";
import IngredientsList from "../../components/IngredientsList";
import ProceduresCard from "../../components/ProceduresCard";
import VideoTutorial from "../../components/VideoTutorial";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import apiService from "../../services/apiService";
import { RecipeTransformer } from "../../utils/recipeTransformer";

export default function MealView() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    
    const [recipeDetails, setRecipeDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Extract parameters
    const recipeId = params.id;
    const servings = parseInt(params.servings) || 4;
    const recipeName = params.name;
    const recipeDesc = params.desc;
    const imgKey = params.imgKey;
    const hasRemoteImage = params.hasRemoteImage === 'true';
    const remoteImageUrl = params.remoteImageUrl;

    useEffect(() => {
        if (recipeId) {
            fetchRecipeDetails();
        }
    }, [recipeId, servings]);

    const fetchRecipeDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.getScaledRecipe(recipeId, servings);
            const transformedRecipe = RecipeTransformer.transformScaledRecipe(response);
            
            setRecipeDetails(transformedRecipe);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const retryFetch = () => {
        fetchRecipeDetails();
    };

    // Get image source using RecipeTransformer for consistency
    let imageSource;
    if (recipeDetails?.img) {
        // Use the image from transformed recipe data
        imageSource = recipeDetails.img;
    } else if (hasRemoteImage && remoteImageUrl) {
        // Use remote image URL passed from MealCard
        imageSource = { uri: remoteImageUrl };
    } else if (recipeName) {
        // Generate image from recipe name using RecipeTransformer
        imageSource = RecipeTransformer.getImageSource(recipeName);
    } else if (imgKey) {
        // Legacy fallback using imgKey parameter
        const legacyImageMap = {
            'chicken-afritada': require('../../assets/images/chicken-afritada.png'),
            'fried-bangus': require('../../assets/images/fried-bangus.png'),
            'pork-adobo': require('../../assets/images/pork-adobo.png'),
            'beef-mechado': require('../../assets/images/beef-mechado.png'),
            'lumpiang-shanghai': require('../../assets/images/lumpiang-shanghai.png'),
        };
        imageSource = legacyImageMap[imgKey];
    }

    // Use transformed recipe data if available, otherwise fallback to params
    const ingredients = recipeDetails?.ingredients?.map(ing => ing.displayText) || [];
    const procedures = recipeDetails?.procedures?.map(proc => proc.description) || [];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView>
                <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 16, left: 10, zIndex: 1, backgroundColor: 'rgba(81, 34, 91, 0.5)', padding: 6, borderRadius: 20 }}>
                    <Ionicons name="chevron-back" size={24} color='white' />
                </TouchableOpacity>
                
                {/* Always show image if available */}
                {imageSource && (
                    <Image 
                        source={imageSource} 
                        style={{ 
                            width: "100%", 
                            height: 250,
                            resizeMode: 'cover'
                        }} 
                    />
                )}
                
                {/* Fallback image if no specific image is available */}
                {!imageSource && (
                    <Image 
                        source={require('../../assets/images/chicken-afritada.png')} 
                        style={{ 
                            width: "100%", 
                            height: 250,
                            resizeMode: 'cover'
                        }} 
                    />
                )}
                <View
                    style={{
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: theme.card,
                        marginTop: -20,
                        paddingTop: 16,
                        paddingBottom: 8,
                        paddingHorizontal: 8,
                        // subtle shadow to separate from image
                        shadowColor: '#000',
                        shadowOpacity: 0.08,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 3,
                        overflow: 'hidden',
                        width: '100%',
                    }}
                >
                    <View style={{ flex: 1, paddingHorizontal: 16 }}>
                        <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 24, marginBottom: 4, color: theme.primary }}>
                            {recipeName}
                        </Text>
                        <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: theme.subtext, marginBottom: 8 }}>
                            {recipeDesc}
                        </Text>

                        {/* Cost Information */}
                        {recipeDetails && (
                            <View style={{ 
                                flexDirection: 'row', 
                                justifyContent: 'space-between', 
                                marginBottom: 16,
                                padding: 12,
                                backgroundColor: theme.surface || theme.background,
                                borderRadius: 8
                            }}>
                                <View>
                                    <Text style={{ 
                                        fontFamily: 'Montserrat-SemiBold', 
                                        fontSize: 16, 
                                        color: theme.primary 
                                    }}>
                                        ₱{recipeDetails.totalCost?.toFixed(2)}
                                    </Text>
                                    <Text style={{ 
                                        fontFamily: 'Montserrat-Regular', 
                                        fontSize: 12, 
                                        color: theme.subtext 
                                    }}>
                                        Total Cost
                                    </Text>
                                </View>
                                <View>
                                    <Text style={{ 
                                        fontFamily: 'Montserrat-SemiBold', 
                                        fontSize: 16, 
                                        color: theme.primary 
                                    }}>
                                        ₱{recipeDetails.costPerServing?.toFixed(2)}
                                    </Text>
                                    <Text style={{ 
                                        fontFamily: 'Montserrat-Regular', 
                                        fontSize: 12, 
                                        color: theme.subtext 
                                    }}>
                                        Per Serving
                                    </Text>
                                </View>
                                <View>
                                    <Text style={{ 
                                        fontFamily: 'Montserrat-SemiBold', 
                                        fontSize: 16, 
                                        color: theme.text 
                                    }}>
                                        {servings}
                                    </Text>
                                    <Text style={{ 
                                        fontFamily: 'Montserrat-Regular', 
                                        fontSize: 12, 
                                        color: theme.subtext 
                                    }}>
                                        Servings
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {loading ? (
                        <LoadingSkeleton type="ingredients" />
                    ) : error ? (
                        <View style={{ 
                            padding: 20, 
                            alignItems: 'center',
                            backgroundColor: theme.card,
                            borderRadius: 12,
                            margin: 16
                        }}>
                            <Ionicons name="alert-circle-outline" size={48} color={theme.error || '#FF6B6B'} />
                            <Text style={{ 
                                fontFamily: 'Montserrat-Medium', 
                                fontSize: 16, 
                                color: theme.text,
                                textAlign: 'center',
                                marginTop: 12,
                                marginBottom: 16
                            }}>
                                {error}
                            </Text>
                            <TouchableOpacity 
                                onPress={retryFetch}
                                style={{
                                    backgroundColor: theme.primary,
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 8
                                }}
                            >
                                <Text style={{ 
                                    color: 'white', 
                                    fontFamily: 'Montserrat-SemiBold',
                                    fontSize: 14
                                }}>
                                    Try Again
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : recipeDetails ? (
                        <>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginBottom: 8, marginHorizontal: 16, color: theme.text }}>
                                Ingredients{" "}
                                <Text style={{ color: theme.primary }}>
                                    ({ingredients.length})
                                </Text>
                            </Text>
                            <IngredientsList ingredients={ingredients} />

                            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginBottom: 8, marginHorizontal: 16, color: theme.text }}>
                                Procedures
                            </Text>
                            <ProceduresCard procedures={procedures} />
                        </>
                    ) : null}

                    {/* Video tutorial section */}
                    <VideoTutorial
                        thumbnail={params.videoThumbnail}
                        url={params.videoUrl}
                        title={params.videoTitle}
                        author={params.videoAuthor}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}