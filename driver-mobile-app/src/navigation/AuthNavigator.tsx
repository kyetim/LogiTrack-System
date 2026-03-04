import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

export type AuthStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0D0D0D' },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name="Splash"
                component={SplashScreen}
                options={{ animation: 'none' }}
            />

            <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
            />

            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />

            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: '#0D0D0D' },
                    headerTintColor: '#FFFFFF',
                    headerTitle: '',
                    headerBackTitle: '', // Works for iOS back button consistency
                    headerShadowVisible: false, // Clean look without bottom border
                }}
            />
        </Stack.Navigator>
    );
};
