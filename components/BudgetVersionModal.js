import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function BudgetVersionModal({
    visible,
    onClose,
    loading,
    errorText,
    content,
    title = 'Budget Version',
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 14,
                    padding: 16,
                    maxHeight: '75%',
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 6,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, }}>
                        <MaterialCommunityIcons name="star-four-points" size={24} color="rgb(85, 135, 222)" style={{ marginRight: 4, position: 'absolute', top: 1}} />
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, marginBottom: 8, color: '#51225B', marginLeft: 30}}>{title}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#E8D5EE', marginBottom: 12 }} />

                    {loading ? (
                        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                            <ActivityIndicator size="large" color="#51225B" />
                            <Text style={{ fontFamily: 'Montserrat-Regular', marginTop: 8, color: '#555' }}>Generating with Gemini…</Text>
                        </View>
                    ) : errorText ? (
                        <Text style={{ fontFamily: 'Montserrat-Regular', color: 'red', marginHorizontal: 8, textAlign: 'center' }}>{errorText}</Text>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: '100%' }}>
                            <Markdown>
                                <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 14, lineHeight: 22, color: '#333', margin: 6, textAlign: 'justify' }}>{content}</Text>
                            </Markdown>
                        </ScrollView>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                        <TouchableOpacity onPress={onClose} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', color: '#51225B' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
