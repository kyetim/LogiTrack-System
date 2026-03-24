import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    // Android channel setup
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'LogiTrack Bildirimler',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#2563EB',
        });
    }

    // Notifications only work on physical devices, not simulators
    if (!Device.isDevice) {
        console.log('[PushNotif] Emulator/simulator detected - push notifications skipped.');
        return undefined;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[PushNotif] Push notification permission denied.');
        return undefined;
    }

    // Try to get the Expo push token
    // projectId is required for standalone builds but optional for Expo Go dev mode
    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        );
        const token = tokenData.data;
        console.log('[PushNotif] Expo Push Token obtained:', token);
        return token;
    } catch (e: any) {
        // In Expo Go without a valid projectId this is expected — not a fatal error
        console.warn('[PushNotif] Could not get push token (expected in Expo Go dev mode):', e?.message ?? e);
        return undefined;
    }
}

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notif => {
            setNotification(notif);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[PushNotif] Notification tapped:', response.notification.request.content);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    return { expoPushToken, notification };
}
