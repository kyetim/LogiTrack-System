import 'react-native-gesture-handler';
import { View } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { store, RootState, useAppDispatch } from '../store';
import { fetchConversations, incrementUnreadCount } from '../store/slices/messagesSlice';
import { setStatus } from '../store/slices/availabilitySlice';
import { COLORS } from '../utils/constants';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useNetworkSync } from '../src/hooks/useNetworkSync';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionOnboardingScreen, PERMISSION_DONE_KEY } from '../src/screens/auth/PermissionOnboardingScreen';
import { api } from '../services/api';
import { startLocationTracking } from '../services/locationTracking';
import { websocketService } from '../services/websocket';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';

import * as Sentry from '@sentry/react-native';

Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__, // Sadece production'da aktif
    tracesSampleRate: 0.1,
});

SplashScreen.preventAutoHideAsync();

// Global unhandled promise rejection handler
const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
; (global as any).ErrorUtils?.setGlobalHandler?.(
    (error: Error, isFatal?: boolean) => {
        if (__DEV__) {
            console.error('[GlobalError]', error, 'isFatal:', isFatal);
        } else {
            Sentry.captureException(error);
        }
        originalHandler?.(error, isFatal);
    }
);

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: COLORS.primary,
        secondary: COLORS.info, // Corrected to use Slate Blue as Secondary
        tertiary: COLORS.warning, // Added Amber as Tertiary/Accent
        error: COLORS.danger,
    },
};

function AppContent() {
    const { expoPushToken } = usePushNotifications();
    const { token } = useSelector((state: RootState) => state.auth);
    const driver = useSelector((state: RootState) => state.auth.driver);
    const dispatch = useAppDispatch();
    // Offline-First: Ağ bağlantısı izleme ve otomatik sync
    useNetworkSync();

    // Permission onboarding — tek seferlik, ilk login sonrası
    const [showPermissionScreen, setShowPermissionScreen] = useState(false);

    useEffect(() => {
        if (token && driver) {
            AsyncStorage.getItem(PERMISSION_DONE_KEY).then(done => {
                if (!done) setShowPermissionScreen(true);
            });
        }
    }, [token, driver]);

    // Auth yüklendiğinde availability slice'ı driver.status ile senkronize et
    useEffect(() => {
        if (driver) {
            let derivedStatus: 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY' = 'OFF_DUTY';
            if (driver.status === 'OFF_DUTY') {
                derivedStatus = 'OFF_DUTY';
            } else if (driver.status === 'ON_DUTY' && (driver as any).isAvailable === true) {
                derivedStatus = 'AVAILABLE';
            } else if (driver.status === 'ON_DUTY' && !(driver as any).isAvailable) {
                derivedStatus = 'ON_DUTY';
            }
            dispatch(setStatus(derivedStatus));

            // Önceki session'da online bırakıldıysa tracking'i otomatik yeniden başlat
            // Bu sayede toggle açık görünürken konum gerçekten gönderilir
            if (derivedStatus !== 'OFF_DUTY') {
                startLocationTracking().catch(err =>
                    console.warn('[Layout] Auto-resume tracking failed:', err)
                );
            }
        }
    }, [driver]);

    const router = useRouter();

    useEffect(() => {
        if (expoPushToken && token) {
            api.registerPushToken(expoPushToken).catch(err =>
                console.log('Failed to register push token:', err)
            );
        }

        if (token) {
            websocketService.connect();
            websocketService.connectSupportSocket();

            const handleGlobalNewMessage = (_message: any) => {
                dispatch(incrementUnreadCount());
                dispatch(fetchConversations());
            };
            websocketService.onNewMessage(handleGlobalNewMessage);

            return () => {
                websocketService.offNewMessage(handleGlobalNewMessage);
            };
        } else {
            websocketService.disconnect();
            websocketService.disconnectSupportSocket();
            // BULLETPROOF: Force router to kick out
            if (router) {
                console.log('Global auth state recognized as NULL -> routing to /(auth)');
                router.replace('/(auth)');
            }
        }
    }, [expoPushToken, token]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
                <PaperProvider theme={theme}>
                    <StatusBar style="light" backgroundColor="transparent" translucent={true} />
                    <View style={{ flex: 1 }}>
                        <Slot />
                        {showPermissionScreen && (
                            <View style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                zIndex: 999,
                            }}>
                                <PermissionOnboardingScreen
                                    onComplete={() => setShowPermissionScreen(false)}
                                />
                            </View>
                        )}
                    </View>
                </PaperProvider>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        Syne_700Bold,
        Syne_800ExtraBold,
        Outfit_400Regular,
        Outfit_500Medium,
        Outfit_600SemiBold,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <ErrorBoundary>
            <Provider store={store}>
                <SafeAreaProvider>
                    <AppContent />
                </SafeAreaProvider>
            </Provider>
        </ErrorBoundary>
    );
}
