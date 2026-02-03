import { Slot } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store, RootState } from '../store';
import { COLORS } from '../utils/constants';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useEffect } from 'react';
import { api } from '../services/api';

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: COLORS.primary,
        secondary: COLORS.success,
        error: COLORS.danger,
    },
};

function AppContent() {
    const { expoPushToken } = usePushNotifications();
    const { token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (expoPushToken && token) {
            api.registerPushToken(expoPushToken).catch(err =>
                console.log('Failed to register push token:', err)
            );
        }
    }, [expoPushToken, token]);

    return (
        <PaperProvider theme={theme}>
            <StatusBar style="auto" />
            <Slot />
        </PaperProvider>
    );
}

export default function RootLayout() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <AppContent />
            </SafeAreaProvider>
        </Provider>
    );
}
