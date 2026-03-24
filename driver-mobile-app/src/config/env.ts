// Tip güvenli environment erişimi
export const ENV = {
    API_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
    WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? '',
    // TODO: .env.production'da EXPO_PUBLIC_MQTT_URL'i 
    // gerçek broker adresiyle doldur — 'your-production-url.com' placeholder
    MQTT_URL: process.env.EXPO_PUBLIC_MQTT_URL || (__DEV__ ? 'ws://192.168.1.127:9001' : 'wss://your-production-url.com:9001'),
    IS_DEV: process.env.EXPO_PUBLIC_ENV === 'development',
    IS_PROD: process.env.EXPO_PUBLIC_ENV === 'production',
} as const;

// Kritik değerlerin boş olmadığını kontrol et
if (!ENV.API_URL) {
    console.error('❌ EXPO_PUBLIC_API_URL tanımlı değil!');
}
