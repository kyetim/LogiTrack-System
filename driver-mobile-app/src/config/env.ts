import { Platform } from 'react-native';

const getDevApiUrl = () => {
    // Android emilatörleri 10.0.2.2 üzerinden, iOS simülatörleri localhost üzerinden host'a ulaşır.
    if (process.env.EXPO_PUBLIC_ENV === 'development') {
        return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://127.0.0.1:3000/api';
    }
    return process.env.EXPO_PUBLIC_API_URL ?? '';
};

const getDevWsUrl = () => {
    if (process.env.EXPO_PUBLIC_ENV === 'development') {
        return Platform.OS === 'android' ? 'ws://10.0.2.2:3000' : 'ws://127.0.0.1:3000';
    }
    return process.env.EXPO_PUBLIC_WS_URL ?? '';
};

// Tip güvenli environment erişimi
export const ENV = {
    API_URL: getDevApiUrl(),
    WS_URL: getDevWsUrl(),
    // TODO: .env.production'da EXPO_PUBLIC_MQTT_URL'i 
    // gerçek broker adresiyle doldur — 'your-production-url.com' placeholder
    MQTT_URL: process.env.EXPO_PUBLIC_MQTT_URL || (__DEV__ ? (Platform.OS === 'android' ? 'ws://10.0.2.2:9001' : 'ws://127.0.0.1:9001') : 'wss://your-production-url.com:9001'),
    IS_DEV: process.env.EXPO_PUBLIC_ENV === 'development',
    IS_PROD: process.env.EXPO_PUBLIC_ENV === 'production',
} as const;

// Kritik değerlerin boş olmadığını kontrol et
if (!ENV.API_URL) {
    console.error('❌ EXPO_PUBLIC_API_URL veya Dinamik URL tanımlı değil!');
}
