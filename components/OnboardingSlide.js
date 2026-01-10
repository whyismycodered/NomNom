import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const scale = screenWidth / 375;

export default function OnboardingSlide({ slide, width, height }) {
  return (
    <View style={[styles.slide, { width, height }]}>
      <LinearGradient
        colors={slide.gradient}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {slide.title === 'Get cooking with NomNom!' ? (
          <>
            {slide.character && (
              <Image
                source={slide.character}
                style={[styles.characterLarge, { width: 240 * scale, height: 240 * scale, marginBottom: 0 }]}
                resizeMode="contain"
              />
            )}

            <Text style={[
              {
                fontFamily: 'Montserrat-Bold',
                textAlign: 'center',
                color: '#333',
                fontSize: 24 * scale,
                marginTop: 5 * scale, 
                marginBottom: 10 * scale,
              }
            ]}>
              Get cooking with <Text style={{ color: '#8B00C2' }}>NomNom</Text>!
            </Text>

            {slide.body && (
              <Text style={[styles.body, { fontSize: 15 * scale, lineHeight: 22 * scale, marginHorizontal: 20 * scale, marginTop: 10 * scale }]}>
                {slide.body}
              </Text>
            )}
          </>
        ) : (
          <>
            {slide.title === 'Struggling to pick meals on a budget?' && (
              <Text style={{
                position: 'absolute',
                top: 20 * scale,
                left: '50%',
                transform: [{ translateX: -50 }],
                fontSize: 100 * scale,
                color: 'white',
                fontFamily: 'Montserrat-Bold',
                zIndex: 10,
              }}>
                
              </Text>
            )}

            <Text style={[
              {
                fontFamily: 'Montserrat-Bold',
                textAlign: 'center',
                color: '#333',
                fontSize: slide.title === 'NomNom provides you with:' ? 19 * scale : 25 * scale, 
                marginTop: slide.title === 'Struggling to pick meals on a budget?' ? 40 * scale :
                           slide.title === "What's inside?" ? -10 * scale :
                           slide.title === 'NomNom provides you with:' ? -15 * scale : 5 * scale,
                marginBottom: slide.title === 'Struggling to pick meals on a budget?' ? 15 * scale :
                              slide.title === "What's inside?" ? 1 * scale :
                              slide.title === 'NomNom provides you with:' ? 1 * scale : 5 * scale,
              }
            ]}>{slide.title}</Text>

            {slide.character && (
              <Image
                source={slide.character}
                style={[styles.characterLarge, { width: 240 * scale, height: 240 * scale }]}
                resizeMode="contain"
              />
            )}

            {slide.characterSmall && (
              <Image
                source={slide.characterSmall}
                style={[styles.characterSmall, { width: 250 * scale, height: 380 * scale, right: 0, bottom: 30 * scale }]}
                resizeMode="contain"
              />
            )}

            {slide.body && (
              <Text style={[styles.body, { fontSize: 15 * scale, lineHeight: 22 * scale, marginHorizontal: 20 * scale, marginTop: 10 * scale }]}>
                {slide.body.startsWith('NomNom') ? (
                  <>
                    <Text style={{ fontFamily: 'Montserrat-Bold' }}>
                      <Text style={{ color: '#8B00C2' }}>NomNom</Text> is here to help you!
                    </Text>{'\n\n'}
                    <Text>Discover affordable, delicious recipes tailored to your budget.</Text>
                  </>
                ) : (
                  slide.body
                )}
              </Text>
            )}

            {slide.chatText && (
              <View style={styles.chatContainer}>
                <View style={[styles.chatBubble, { padding: 16 * scale, width: '90%' }]}>
                  <Text style={[styles.chatText, { fontSize: 15 * scale }]}>{slide.chatText}</Text>
                </View>

                <Image
                  source={require('../assets/images/phonemock.png')}
                  style={[styles.phoneImage, { width: 200 * scale, height: 360 * scale }]}
                  resizeMode="contain"
                />
              </View>
            )}

            {slide.ingredients && (
              <View style={[styles.ingredientCard, { padding: 16 * scale, marginTop: 12 * scale }]}>
                {slide.ingredients.map((ing, idx) => (
                  <Text key={idx} style={[styles.ingredientText, { fontSize: 11 * scale, marginVertical: 6 * scale }]}>
                    {ing}
                  </Text>
                ))}
              </View>
            )}

            {slide.recipeImage && (
              <View style={[styles.recipeCard, { height: 190 * scale, marginTop: 14 * scale }]}>
                <Image
                  source={slide.recipeImage}
                  style={styles.recipeImg}
                />
                <View style={[styles.recipeOverlay, { padding: 16 * scale }]}>
                  <Text style={[styles.recipeBig, { fontSize: 20 * scale }]}>
                    {slide.recipeTitle}
                  </Text>
                  <Text style={[styles.recipeSmall, { fontSize: 14 * scale, marginTop: 4 * scale }]}>
                    {slide.recipeSubtitle}
                  </Text>
                </View>
              </View>
            )}
          </>
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
    paddingTop: 65 * scale, // Restored for consistent top spacing
    paddingHorizontal: 24 * scale,
    alignItems: 'center',
  },
  title: {
    // Removed shared title styles; now inline per slide
  },
  characterLarge: {
    marginTop: 20 * scale,
    marginBottom: 5 * scale,
  },
  characterSmall: {
    position: 'absolute',
    zIndex: 20,
    elevation: 10,
    transform: [{ rotate: '1deg' }],
  },
  body: {
    fontFamily: 'Montserrat-Medium', // Reverted to medium for the second part
    textAlign: 'center',
    color: '#555',
    marginTop: 10 * scale,
  },
  chatContainer: {
    alignItems: 'center',
    marginTop: 10 * scale,
  },
  chatBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12 * scale,
    elevation: 6,
  },
  chatText: {
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    color: '#333',
  },
  phoneImage: {
   
  },
  ingredientCard: {
    backgroundColor: '#F3F2E9',
    borderRadius: 14,
    width: '95%',
    borderWidth: 1,
    borderColor: '#BA93CA',
  },
  ingredientText: {
    fontFamily: 'Montserrat-Regular',
    color: '#444',
  },
  recipeCard: {
    width: '95%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  recipeImg: {
    width: '100%',
    height: '100%',
  },
  recipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139,0,196,0.55)',
    justifyContent: 'flex-end',
  },
  recipeBig: {
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  recipeSmall: {
    fontFamily: 'Montserrat-Medium',
    color: '#fff',
  },
});