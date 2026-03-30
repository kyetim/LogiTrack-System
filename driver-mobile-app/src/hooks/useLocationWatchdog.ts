import { useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

const WATCHDOG_INTERVAL_MS = 30_000;        // 30 saniyede bir kontrol
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 dakika sessiz = stale

// locationTracking.ts'ten çağrılan global zaman damgası
let _lastSuccessTime: number | null = null;

export const setLastLocationSuccess = (time: number | null) => {
    _lastSuccessTime = time;
};

export const getLastLocationSuccess = () => _lastSuccessTime;

export const useLocationWatchdog = (isOnline: boolean) => {
    const alertedRef = useRef(false);

    useEffect(() => {
        // Offline iken çalışma — state'i temizle
        if (!isOnline) {
            alertedRef.current = false;
            _lastSuccessTime = null;
            return;
        }

        const timer = setInterval(async () => {
            if (!isOnline || alertedRef.current) return;

            // 1. Konum izni kontrolü
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                alertedRef.current = true;
                Alert.alert(
                    '📍 Konum İzni Kapalı',
                    'Çevrimiçi olduğunuz halde konum izniniz kapalı. Görevleriniz etkilenebilir.',
                    [
                        { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
                        { text: 'Anladım', onPress: () => { alertedRef.current = false; } },
                    ]
                );
                return;
            }

            // 2. Stale konum kontrolü (en az 1 başarılı gönderim sonrası devreye girer)
            if (_lastSuccessTime !== null && Date.now() - _lastSuccessTime > STALE_THRESHOLD_MS) {
                alertedRef.current = true;
                Alert.alert(
                    '⚠️ Konum Güncellenemiyor',
                    'Son 2 dakikadır konumunuz güncellenemiyor. İnternet bağlantınızı veya konum ayarlarınızı kontrol edin.',
                    [
                        { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
                        { text: 'Anladım', onPress: () => { alertedRef.current = false; } },
                    ]
                );
            }
        }, WATCHDOG_INTERVAL_MS);

        return () => clearInterval(timer);
    }, [isOnline]);
};
