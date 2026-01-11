import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, View, Image, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";
import IngredientsList from "../../components/IngredientsList";
import ProceduresCard from "../../components/ProceduresCard";
import { Badge, DifficultyBadge } from "../../components/Badge";

export default function MealView() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    // params: { name, desc, imgKey?, img?, ingredients?, ... }

    // Map local image keys to static require paths
    const imageMap = {
        'chicken-afritada': require('../../assets/images/chicken-afritada.png'),
        'fried-bangus': require('../../assets/images/fried-bangus.png'),
        'pork-adobo': require('../../assets/images/pork-adobo.png'),
        'beef-mechado': require('../../assets/images/beef-mechado.png'),
        'lumpiang-shanghai': require('../../assets/images/lumpiang-shanghai.png'),
    };

    let imageSource;
    if (typeof params.imgKey === 'string' && imageMap[params.imgKey]) {
        imageSource = imageMap[params.imgKey];
    } else if (typeof params.img === 'string' && params.img.startsWith('http')) {
        imageSource = { uri: params.img };
    }

    // Ingredients: expects params.ingredients as array or string
    let ingredients = [];
    if (Array.isArray(params.ingredients)) {
        ingredients = params.ingredients;
    } else if (typeof params.ingredients === 'string') {
        ingredients = params.ingredients.split('\n').filter(Boolean);
    }

    // Procedures: expects params.procedures as array or newline-delimited string
    let procedures = [];
    if (Array.isArray(params.procedures)) {
        procedures = params.procedures;
    } else if (typeof params.procedures === 'string') {
        procedures = params.procedures.split('\n').filter(Boolean);
    }

    // Difficulty badge handled by component

    // Prep/Cook time badges
    const prepTimeVal = (typeof params.prepTime === 'number' || typeof params.prepTime === 'string') ? params.prepTime : null;
    const cookTimeVal = (typeof params.cookTime === 'number' || typeof params.cookTime === 'string') ? params.cookTime : null;
    const formatMinutes = (v) => {
        if (v == null) return null;
        if (typeof v === 'number') return `${v} min`;
        const s = String(v).trim();
        return /min\b/i.test(s) ? s : `${s} min`;
    };
    const prepLabel = formatMinutes(prepTimeVal);
    const cookLabel = formatMinutes(cookTimeVal);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView>
                <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 16, left: 10, zIndex: 1, backgroundColor: 'rgba(81, 34, 91, 0.5)', padding: 6, borderRadius: 20 }}>
                    <Ionicons name="chevron-back" size={24} color='white' />
                </TouchableOpacity>
                {imageSource && (
                    <Image source={imageSource} style={{ width: "100%", height: 250 }} />
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
                        <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 24, marginBottom: 4, color: theme.primary }}>{params.name}</Text>
                        {/* Badge row under name */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                            <DifficultyBadge level={params.difficulty} style={{ marginRight: 8, marginBottom: 8 }} />
                            {prepLabel && (
                                <Badge label={`Prep: ${prepLabel}`} bgColor="#ede9fe" textColor="#5b21b6" style={{ marginRight: 8, marginBottom: 8 }} />
                            )}
                            {cookLabel && (
                                <Badge label={`Cook: ${cookLabel}`} bgColor="#e0f2fe" textColor="#075985" style={{ marginRight: 8, marginBottom: 8 }} />
                            )}
                        </View>
                        <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: theme.subtext, marginBottom: 16 }}>{params.desc}</Text>

                    </View>
                    <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginBottom: 4, marginHorizontal: 16, color: theme.text }}>Ingredients{" "}<Text style={{ color: theme.primary }}>({ingredients.length})</Text></Text>
                    {params.servings != null && (
                        <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 12, color: theme.subtext, marginBottom: 8, marginHorizontal: 16 }}>
                            Serving for {params.servings}
                        </Text>
                    )}
                    <IngredientsList ingredients={ingredients} />

                    <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginBottom: 8, marginHorizontal: 16, color: theme.text }}>Procedures</Text>
                    <ProceduresCard procedures={procedures} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}