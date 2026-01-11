import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const VideoTutorial = ({ thumbnail, url, title, author }) => {
    const { theme } = useTheme();

    if (!thumbnail) return null;

    return (
        <View>
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginVertical: 8, color: theme.text, marginHorizontal: 16 }}>Watch a YouTube Tutorial</Text>
            <View style={{ borderWidth: 1, borderColor: theme.primary, borderRadius: 12, marginBottom: 24, marginHorizontal: 16, overflow: 'hidden', backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}>
                <TouchableOpacity onPress={() => { if (url) Linking.openURL(url); }}>
                    <Image source={{ uri: thumbnail }} style={{ width: 'auto%', height: 192, marginBottom: 8, borderRadius: 8 }} />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 15, marginBottom: 2, color: theme.primary, marginLeft: 8 }}>{title || ''}</Text>
                <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 12, marginBottom: 8, color: theme.subtext, marginLeft: 8 }}>{author || ''}</Text>
            </View>
        </View>
    );
};

export default VideoTutorial;
