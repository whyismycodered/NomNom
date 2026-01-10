import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingSlide from '../components/OnboardingSlide';
import BottomNavigation from '../components/BottomNavigation';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    gradient: ['#FFFD9B', '#AEE3C6', '#9BD9CE'],
    title: 'Struggling to pick meals on a budget?',
    character: require('../assets/images/nomnom-ob.png'),
    body:
      'NomNom is here to help you!\n\nDiscover affordable, delicious recipes tailored to your budget.',
    button: 'Get Started with NomNom',
  },
  {
    gradient: ['#FFFD9B', '#AEE3C6', '#9BD9CE'],
    title: "What's inside?",
    chatText:
      'Great to see you!\nWhat do you feel like cooking?\nWhat’s your budget? e.g. ₱100',
    characterSmall: require('../assets/images/smile-nomnom.png'),
    showNextSkip: true,
  },
  {
    gradient: ['#FFFD9B', '#AEE3C6', '#9BD9CE'],
    title: 'NomNom provides you with:',
    ingredients: [
      'Cooked rice (preferably day-old)     2 cups',
      'Sausage, sliced                                     2 pcs',
      'Garlic, minced                                      2 cloves',
    ],
    recipeImage: require('../assets/images/afritada-tutorial.png'),
    recipeTitle: 'DELICIOUS CHICKEN starter',
    recipeSubtitle: 'How to cook Chicken Afritada\nby MOMMY TONI FOWLER',
    showNextSkip: true,
  },
  {
    gradient: ['#FFFD9B', '#AEE3C6', '#9BD9CE'],
    title: 'Get cooking with NomNom!',
    character: require('../assets/images/nomnom-budget2.png'),
    body:
      'Tell us your budget and preferences,\nand we’ll suggest the perfect meals!',
    button: 'Tell NomNom your budget!',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const scrollTo = (i) => {
    scrollRef.current?.scrollTo({
      x: width * i,
      animated: true,
    });
  };

  const onFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(
            Math.round(
              e.nativeEvent.contentOffset.x / width
            )
          )
        }
      >
        {slides.map((slide, i) => (
          <OnboardingSlide
            key={i}
            slide={slide}
            width={width}
            height={height}
          />
        ))}
      </ScrollView>

      <BottomNavigation
        slide={slides[index]}
        index={index}
        totalSlides={slides.length}
        onNext={() =>
          index === slides.length - 1
            ? onFinish()
            : scrollTo(index + 1)
        }
        onFinish={onFinish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});