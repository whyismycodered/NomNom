import { useState, useEffect } from 'react';
import { FlatList, Text } from 'react-native';
import MealCard from '../components/MealCard';

const MealContainer = ({ budget, searchQuery }) => {
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        fetchMealsFromGemini(budget, searchQuery)
            .then((data) => {
                if (isMounted) setMeals(data);
            })
            .catch((err) => {
                if (isMounted) setError('Failed to load meals');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [budget, searchQuery]);

    const renderMeal = ({ item, index }) => <MealCard item={item} index={index} />;

    if (loading) {
        return <Text style={{ textAlign: 'center', marginTop: 32 }}>Loading meals...</Text>;
    }
    if (error) {
        return <Text style={{ textAlign: 'center', marginTop: 32, color: 'red' }}>{error}</Text>;
    }
    if (!meals || meals.length === 0) {
        return <Text style={{ textAlign: 'center', marginTop: 32 }}>No meals found.</Text>;
    }

    return (
        <FlatList
            data={meals}
            renderItem={renderMeal}
            keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 8 }}
        />
    );
}

export default MealContainer