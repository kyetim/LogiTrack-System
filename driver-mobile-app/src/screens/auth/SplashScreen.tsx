import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { HexLogo } from '@/components/ui/HexLogo';
import { Colors, Typography, FontSizes } from '@/theme/tokens';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

// Define expected Navigation prop types for TS
interface SplashScreenProps {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'>;
}

const { width } = Dimensions.get('window');
const BAR_WIDTH = width - 80;

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start progress bar animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: false, // We use width which doesn't support native driver perfectly
        }).start();

        // After 2000ms navigate to Onboarding
        const timeout = setTimeout(() => {
            navigation.replace('Onboarding');
        }, 2000);

        return () => clearTimeout(timeout);
    }, [navigation, progressAnim]);

    // Interpolate 0-1 value to pixel width
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, BAR_WIDTH],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Center Block */}
            <View style={styles.centerContent}>
                <HexLogo size="lg" showGlow={true} />
                <Text style={styles.title}>LogiTrack</Text>
                <Text style={styles.subtitle}>Deliver Smarter</Text>
            </View>

            {/* Bottom Loading Bar */}
            <View style={styles.bottomContainer}>
                <View style={styles.barBackground}>
                    <Animated.View style={[styles.barForeground, { width: progressWidth }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // #0D0D0D
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        // Push it slightly up from true center visually
        marginTop: -40,
    },
    title: {
        fontFamily: Typography.fontDisplayBold, // Syne_800ExtraBold
        fontSize: 28,
        color: Colors.white,
        marginTop: 40,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontFamily: Typography.fontBody, // Outfit_400Regular
        fontSize: 13,
        color: Colors.gray, // #8A8A8A
        marginTop: 8,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 60,
        width: BAR_WIDTH,
    },
    barBackground: {
        height: 2,
        backgroundColor: Colors.card2, // #2A2A2A
        width: '100%',
        borderRadius: 1,
        overflow: 'hidden',
    },
    barForeground: {
        height: '100%',
        backgroundColor: Colors.primary, // #FFD700
        borderRadius: 1,
    },
});
