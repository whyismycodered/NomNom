import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, View, Image } from "react-native";
import Divider from "@/components/Divider";
import BudgetBadge from "../../components/BudgetBadge";
import { useLocalSearchParams } from "expo-router";

export default function MealView() {
    const params = useLocalSearchParams();
    // params: { name, desc, img, ingredients, ... }
    let imageSource = params.img;
    if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
        imageSource = { uri: imageSource };
    }

    // Ingredients: expects params.ingredients as array or string
    let ingredients = [];
    if (Array.isArray(params.ingredients)) {
        ingredients = params.ingredients;
    } else if (typeof params.ingredients === 'string') {
        ingredients = params.ingredients.split('\n').filter(Boolean);
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView>
                <Image source={imageSource} style={{ width: "100%", height: 250 }} />
                <View style={{ flex: 1, marginHorizontal: 16, marginTop: 12 }}>
                    <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 24, marginBottom: 8 }}>{params.name}</Text>
                    <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 16, color: '#666', marginBottom: 8 }}>{params.desc}</Text>
                    <BudgetBadge />
                </View>
                <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 20, marginBottom: 8 }}>Ingredients</Text>
                <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderColor: '#8B00C4', borderWidth: 1, borderRadius: 8, marginBottom: 16, flexDirection: 'column' }}>
                    {ingredients.length > 0 ? ingredients.map((ing, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 16, marginBottom: 8 }}>- {ing}</Text>
                            <Divider />
                        </View>
                    )) : <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 16, marginBottom: 8 }}>No ingredients listed.</Text>}
                </View>
                {/* Optionally add video/author if available in params */}
                {params.videoThumbnail && (
                    <>
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 20, marginBottom: 8 }}>Watch a YouTube Tutorial</Text>
                        <Image source={{ uri: params.videoThumbnail }} style={{ width: "100%", height: 192, marginBottom: 4 }} />
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 12, marginBottom: 4 }}>{params.videoTitle || ''}</Text>
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 8, marginBottom: 16, color: '#888888' }}>{params.videoAuthor || ''}</Text>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}