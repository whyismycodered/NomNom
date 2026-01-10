import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const ProceduresCard = ({ procedures = [] }) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                backgroundColor: theme.card,
                borderRadius: 15,
                marginHorizontal: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
                borderColor: theme.primary,
                borderWidth: 1,
            }}
        >
            {procedures.length > 0 ? (
                procedures.map((step, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start'}}>
                        <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, color: theme.primary, marginRight: 12 }}>{idx + 1}.</Text>
                        <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 16, flex: 1, color: theme.text }}>{step}</Text>
                    </View>
                ))
            ) : (
                <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 15, color: theme.subtext }}>No procedures provided.</Text>
            )}
        </View>
    );
};

export default ProceduresCard;
