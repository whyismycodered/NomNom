import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function Index() {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const value = await AsyncStorage.getItem('hasSeenOnboarding');
                setHasSeenOnboarding(value === 'true');
            } catch {
                setHasSeenOnboarding(false);
            }
        };
        checkOnboarding();
    }, []);

    if (hasSeenOnboarding === null) {
        return null;
    }

    // Note: Your Home route file is "Home.js" (capitalized), so the path is "/Home".
    return <Redirect href={hasSeenOnboarding ? '/Home' : '/onboarding'} />;
}
