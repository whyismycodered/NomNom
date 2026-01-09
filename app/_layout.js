import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { StatusBar } from 'expo-status-bar';

// Keep the splash screen up until fonts are ready
SplashScreen.preventAutoHideAsync();

function RootStack() {
  const [fontsLoaded, fontError] = useFonts({
    'Fredoka-SemiBold': require('../assets/fonts/Fredoka-SemiBold.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-Italic': require('../assets/fonts/Montserrat-Italic.ttf'),
    'Montserrat-BoldItalic': require('../assets/fonts/Montserrat-BoldItalic.ttf'),
  });
  const { mode } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(value === 'true');
      } catch (e) {
        setHasSeenOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);


  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && hasSeenOnboarding !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hasSeenOnboarding]);

  if (!fontsLoaded || hasSeenOnboarding === null) {
    return null;
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="home" />
        { }
        <Stack.Screen
          name="index"
          redirectTo={hasSeenOnboarding ? '/home' : '/onboarding'}
          options={{ href: null }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  ); 

  }