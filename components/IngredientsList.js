import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const IngredientsList = ({ ingredients = [] }) => {
    const { theme } = useTheme();

    return (
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            {ingredients.length > 0 ? (
                ingredients.map((ing, idx) => {
                    const text = String(ing).trim();
                    // Support quantities like: "2", "2.5", "1/2", "2 1/2" at the start
                    const match = text.match(/^\s*((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+(?:\.\d+)?))\s+(.*)$/);
                    const qty = match ? match[1] : '';
                    let name = match ? match[2] : text;
                    let unit = '';

                    if (match) {
                        const rest = match[2].trim();
                        const tokens = rest.split(/\s+/);
                        const lower = tokens.map(t => t.toLowerCase());
                        const oneWordUnits = [
                            'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
                            'gram', 'grams', 'g', 'kg', 'ml', 'l', 'liter', 'liters', 'clove', 'cloves',
                            'piece', 'pieces', 'pcs', 'pinch', 'pinches', 'oz', 'ounce', 'ounces'
                        ];
                        const twoWordUnits = [
                            'fl oz', 'fluid ounces'
                        ];

                        if (tokens.length >= 2) {
                            const firstTwo = `${lower[0]} ${lower[1]}`;
                            if (twoWordUnits.includes(firstTwo)) {
                                unit = `${tokens[0]} ${tokens[1]}`;
                                name = tokens.slice(2).join(' ');
                            } else if (oneWordUnits.includes(lower[0])) {
                                unit = tokens[0];
                                name = tokens.slice(1).join(' ');
                            } else {
                                name = rest;
                            }
                        } else if (tokens.length === 1) {
                            if (oneWordUnits.includes(lower[0])) {
                                unit = tokens[0];
                                name = tokens.slice(1).join(' ');
                            } else {
                                name = rest;
                            }
                        }
                    }
                    return (
                        <View
                            key={idx}
                            style={{
                                backgroundColor: theme.card,
                                borderRadius: 12,
                                paddingVertical: 10,
                                paddingHorizontal: 14,
                                marginBottom: 10,
                                shadowColor: '#000',
                                shadowOpacity: 0.08,
                                shadowRadius: 6,
                                shadowOffset: { width: 0, height: 3 },
                                elevation: 2,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 16, color: theme.text, flexShrink: 1 }}>{name}</Text>
                            {!!qty && (
                                <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: theme.primary }}>{unit ? `${qty} ${unit}` : qty}</Text>
                            )}
                        </View>
                    );
                })
            ) : (
                <View
                    style={{
                        backgroundColor: theme.card,
                        borderRadius: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        shadowColor: '#000',
                        shadowOpacity: 0.06,
                        shadowRadius: 5,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                    }}
                >
                    <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 15, color: theme.subtext }}>No ingredients listed.</Text>
                </View>
            )}
        </View>
    );
};

export default IngredientsList;
