import React, { useEffect, useState, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, WifiOff } from 'lucide-react-native';

const OfflineBanner = () => {
    const insets = useSafeAreaInsets();
    const isConnectedRef = useRef(true);
    const [displayState, setDisplayState] = useState<'offline' | 'reconnected' | null>(null);

    // Y ekseninde -60dan 0'a
    const bannerAnim = useRef(new Animated.Value(-60)).current;

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected ?? true;

            if (!connected && isConnectedRef.current) {
                // Bağlantı kesildi
                isConnectedRef.current = false;
                setDisplayState('offline');
                Animated.spring(bannerAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            } else if (connected && !isConnectedRef.current) {
                // Bağlantı geri geldi
                isConnectedRef.current = true;
                setDisplayState('reconnected');
                Animated.sequence([
                    Animated.delay(2000),
                    Animated.spring(bannerAnim, {
                        toValue: -60,
                        useNativeDriver: true,
                    }),
                ]).start(() => setDisplayState(null));
            }
        });

        return unsubscribe;
    }, []); // Sadece bir kez mount edildiğinde çalışacak

    if (!displayState) return null;

    const isConnected = displayState === 'reconnected';

    return (
        <Animated.View
            style={[
                styles.banner,
                {
                    paddingTop: insets.top + 8, // Güvenli alan padding'i + ufak boşluk 
                    transform: [{ translateY: bannerAnim }]
                },
                isConnected ? styles.connectedBanner : styles.offlineBanner,
            ]}
        >
            <View style={styles.content}>
                {isConnected ? (
                    <>
                        <Wifi color="#4CAF50" size={16} />
                        <Text style={styles.connectedText}>Bağlantı yeniden kuruldu</Text>
                    </>
                ) : (
                    <>
                        <WifiOff color="#FFFFFF" size={16} />
                        <View style={styles.textContainer}>
                            <Text style={styles.offlineTitle}>İnternet bağlantısı yok</Text>
                            <Text style={styles.offlineSubtitle}>Çevrimdışı modda çalışıyorsunuz</Text>
                        </View>
                    </>
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#1A1A1A',
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    offlineBanner: {
        borderBottomWidth: 1,
        borderBottomColor: '#FF5252',
    },
    connectedBanner: {
        borderBottomWidth: 1,
        borderBottomColor: '#4CAF50',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    textContainer: {
        alignItems: 'flex-start',
    },
    connectedText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        color: '#4CAF50',
    },
    offlineTitle: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        color: '#FFFFFF',
    },
    offlineSubtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 11,
        color: '#8A8A8A',
    },
});

export default OfflineBanner;
