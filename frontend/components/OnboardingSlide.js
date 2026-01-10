import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingSlide({ slide, width, height }) {
  return (
    <View style={[styles.slide, { width, height }]}>
      <LinearGradient
        colors={slide.gradient}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>

        {slide.character && (
          <Image
            source={slide.character}
            style={styles.characterLarge}
            resizeMode="contain"
          />
        )}

        {slide.characterSmall && (
          <Image
            source={slide.characterSmall}
            style={styles.characterSmall}
            resizeMode="contain"
          />
        )}

        {slide.body && (
          <Text style={styles.body}>{slide.body}</Text>
        )}

        {slide.chatText && (
          <View style={styles.chatContainer}>
            <View style={styles.chatBubble}>
              <Text style={styles.chatText}>{slide.chatText}</Text>
            </View>

            <Image
              source={require('../assets/images/phonemock.png')}
              style={styles.phoneImage}
              resizeMode="contain"
            />
          </View>
        )}

        {slide.ingredients && (
          <View style={styles.ingredientCard}>
            {slide.ingredients.map((ing, idx) => (
              <Text key={idx} style={styles.ingredientText}>
                {ing}
              </Text>
            ))}
          </View>
        )}

        {slide.recipeImage && (
          <View style={styles.recipeCard}>
            <Image
              source={slide.recipeImage}
              style={styles.recipeImg}
            />
            <View style={styles.recipeOverlay}>
              <Text style={styles.recipeBig}>
                {slide.recipeTitle}
              </Text>
              <Text style={styles.recipeSmall}>
                {slide.recipeSubtitle}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  characterLarge: {
    width: 240,
    height: 240,
    marginTop: 24,
    marginBottom: 16,
  },
  characterSmall: {
    width: 250,
    height: 380,
    position: 'absolute',
    left: 110,
    bottom: 30,
    zIndex: 20,
    elevation: 10,
    transform: [{ rotate: '1deg' }],
  },
  body: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
    marginHorizontal: 20,
  },
  chatContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  chatBubble: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    width: '90%',
    elevation: 6,
  },
  chatText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    textAlign: 'center',
    color: '#333',
  },
  phoneImage: {
    width: 200,
    height: 360,
  },
  ingredientCard: {
    backgroundColor: '#F3F2E9',
    padding: 16,
    borderRadius: 14,
    width: '95%',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BA93CA',
  },
  ingredientText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    marginVertical: 6,
    color: '#444',
  },
  recipeCard: {
    width: '95%',
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 14,
  },
  recipeImg: {
    width: '100%',
    height: '100%',
  },
  recipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139,0,196,0.55)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  recipeBig: {
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
    fontSize: 20,
  },
  recipeSmall: {
    fontFamily: 'Montserrat-Medium',
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
});
