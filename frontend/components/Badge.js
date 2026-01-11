import { View, Text } from 'react-native';

export function Badge({ label, bgColor = '#eeeeee', textColor = '#333333', style, textStyle }) {
    if (!label) return null;
    return (
        <View style={{
            backgroundColor: bgColor,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9999,
            ...(style || {}),
        }}>
            <Text style={{
                fontFamily: 'Montserrat-Bold',
                fontSize: 12,
                color: textColor,
                letterSpacing: -0.3,
                ...(textStyle || {}),
            }}>
                {label}
            </Text>
        </View>
    );
}

export function DifficultyBadge({ level, style, textStyle }) {
    if (typeof level !== 'string') return null;
    const norm = level.trim().toLowerCase();
    const colorMap = {
        easy: { bg: '#dcfce7', text: '#166534' },
        medium: { bg: '#fef3c7', text: '#92400e' },
        hard: { bg: '#fee2e2', text: '#991b1b' },
    };
    const colors = colorMap[norm];
    if (!colors) return null; // hide unknown levels
    const label = norm.charAt(0).toUpperCase() + norm.slice(1);
    return (
        <Badge
            label={label}
            bgColor={colors.bg}
            textColor={colors.text}
            style={style}
            textStyle={textStyle}
        />
    );
}

export default Badge;