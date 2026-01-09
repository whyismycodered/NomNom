import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, View, Image, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";

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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView>
                <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 16, left: 10, zIndex: 1, backgroundColor: 'rgba(81, 34, 91, 0.5)', padding: 6, borderRadius: 20 }}>
                    <Ionicons name="chevron-back" size={24} color='white' />
                </TouchableOpacity>
                {imageSource && (
                    <Image source={imageSource} style={{ width: "100%", height: 250 }} />
                )}
                <View style={{ flex: 1, marginHorizontal: 16, marginTop: 12 }}>
                    <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 24, marginBottom: 4, color: theme.text }}>{params.name}</Text>
                    <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: theme.subtext, marginBottom: 16 }}>{params.desc}</Text>

                </View>
                <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginBottom: 8, marginHorizontal: 16, color: theme.text }}>Ingredients</Text>
                <View style={{ paddingTop: 12, paddingHorizontal: 14, backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1, borderRadius: 15, marginBottom: 16, flexDirection: 'column', marginHorizontal: 16 }}>
                    {ingredients.length > 0 ? ingredients.map((ing, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 16, marginBottom: 8, color: theme.text }}>{ing}</Text>
                        </View>
                    )) : <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 15, marginBottom: 8, color: theme.subtext }}>No ingredients listed.</Text>}
                </View>

                <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginBottom: 8, marginHorizontal: 16, color: theme.text }}>Procedures</Text>
                {procedures.length > 0 ? procedures.map((step, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, marginHorizontal: 22 }}>
                        <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, color: theme.primary, marginRight: 12 }}>{idx + 1}.</Text>
                        <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 16, flex: 1, color: theme.text }}>{step}</Text>
                    </View>
                )) : <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 15, marginBottom: 8, color: theme.subtext }}>No procedures provided.</Text>}

                {/* Optionally add video/author if available in params */}
                {params.videoThumbnail && (
                    <>
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 20, marginBottom: 8, color: theme.text }}>Watch a YouTube Tutorial</Text>
                        <Image source={{ uri: params.videoThumbnail }} style={{ width: "100%", height: 192, marginBottom: 4 }} />
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 12, marginBottom: 4, color: theme.text }}>{params.videoTitle || ''}</Text>
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 8, marginBottom: 16, color: theme.subtext }}>{params.videoAuthor || ''}</Text>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}