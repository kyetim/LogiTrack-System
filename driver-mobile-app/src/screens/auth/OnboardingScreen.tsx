import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    NativeSyntheticEvent,
    NativeScrollEvent
} from 'react-native';
import { ArrowRight, MapPin, Truck, TrendingUp } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme/tokens';
import { AppButton } from '@/components/ui/AppButton';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

// Define expected Navigation prop types for TS
interface OnboardingScreenProps {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
}

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: "Yakınındaki\nİşleri Bul",
        titleHighlight: "Yakınındaki",
        description: "GPS teknolojisiyle sana en yakın kurye işlerini anında görüntüle ve hemen başvur.",
        illustrationType: "map"
    },
    {
        id: '2',
        title: "Her Teslimatı\nTakip Et",
        titleHighlight: "Her Teslimatı",
        description: "Gerçek zamanlı harita takibi ile rotanı optimize et, müşterileri anında bilgilendir.",
        illustrationType: "tracking"
    },
    {
        id: '3',
        title: "Hızlı\nKazan",
        titleHighlight: "Hızlı",
        description: "Anlık kazanç takibi, haftalık bonus bildirimleri ve şeffaf ödeme sistemi ile finansını yönet.",
        illustrationType: "earnings"
    }
];

// Placeholder illustrations matching specifications
const IllustrationMap = () => (
    <View style={styles.card}>
        <View style={styles.cardContent}>
            <MapPin color={Colors.primary} size={48} />
            <Text style={styles.cardText}>Rota Bulunuyor...</Text>
        </View>
    </View>
);

const IllustrationTracking = () => (
    <View style={styles.cardColumn}>
        {[1, 2, 3].map((_, i) => (
            <View key={i} style={[styles.card, styles.trackingCard]}>
                <View style={[styles.cardContent, styles.trackingCardContent]}>
                    <View style={styles.trackingHeader}>
                        <Truck color={Colors.gray} size={20} />
                        <Text style={styles.cardTextSecondary}>Sipariş #{204 + i}</Text>
                    </View>
                    <View style={[styles.trackingDot, { backgroundColor: i === 0 ? Colors.primary : Colors.grayDim }]} />
                </View>
            </View>
        ))}
    </View>
);

const IllustrationEarnings = () => (
    <View style={styles.card}>
        <View style={styles.cardContent}>
            <TrendingUp color={Colors.success} size={40} />
            <Text style={[styles.cardText, { fontSize: 32, marginTop: 12, color: Colors.white, fontFamily: Typography.fontDisplayBold }]}>
                ₺2.840
            </Text>
            <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.cardTextSecondary}>Aylık Hedef: %72</Text>
        </View>
    </View>
);

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const finishOnboarding = useCallback(() => {
        navigation.replace('Login');
    }, [navigation]);

    const scrollToNext = useCallback(() => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            finishOnboarding();
        }
    }, [currentIndex, finishOnboarding]);

    const renderIllustration = (type: string) => {
        switch (type) {
            case 'map': return <IllustrationMap />;
            case 'tracking': return <IllustrationTracking />;
            case 'earnings': return <IllustrationEarnings />;
            default: return null;
        }
    };

    const renderItem = ({ item }: { item: typeof slides[0] }) => {
        // Split title into highlight and normal parts
        const parts = item.title.split(item.titleHighlight);

        return (
            <View style={styles.slide}>
                {/* Top Section - Illustration */}
                <View style={styles.illustrationContainer}>
                    {renderIllustration(item.illustrationType)}
                </View>

                {/* Bottom Panel */}
                <View style={styles.bottomSheet}>
                    <View style={styles.textContent}>
                        <Text style={styles.title}>
                            {parts[0]}
                            <Text style={styles.titleHighlight}>{item.titleHighlight}</Text>
                            {parts[1]}
                        </Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Grid Pattern (simulated with border lines) */}
            <View style={styles.gridOverlay}>
                <View style={styles.gridLineVertical} />
                <View style={styles.gridLineHorizontal} />
            </View>

            <FlatList
                data={slides}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false } // Width animation doesn't support native driver well
                )}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                ref={slidesRef}
            />

            {/* Pagination & Controls (Absolute overlay on the bottom sheet) */}
            <View style={styles.controlsContainer}>
                {/* Custom Paginator */}
                <View style={styles.paginator}>
                    {slides.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [6, 20, 6],
                            extrapolate: 'clamp',
                        });
                        const dotColor = scrollX.interpolate({
                            inputRange,
                            outputRange: ['#333333', Colors.primary, '#333333'],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={i.toString()}
                                style={[
                                    styles.dot,
                                    { width: dotWidth, backgroundColor: dotColor },
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Buttons */}
                <View style={styles.buttonsRow}>
                    <TouchableOpacity onPress={finishOnboarding} style={styles.skipButton} activeOpacity={0.8}>
                        <Text style={styles.skipText}>Atla</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={scrollToNext} style={styles.nextButton} activeOpacity={0.8}>
                        <ArrowRight color={Colors.background} size={24} strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // #0D0D0D
    },
    // Grid Pattern
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.04,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridLineVertical: {
        height: '100%',
        width: 2,
        backgroundColor: Colors.primary,
    },
    gridLineHorizontal: {
        width: '100%',
        height: 2,
        backgroundColor: Colors.primary,
        position: 'absolute',
    },

    // Slide
    slide: {
        width,
        height: '100%',
    },
    illustrationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },

    // Illustration Cards
    card: {
        width: '100%',
        height: 200,
        backgroundColor: Colors.card, // #242424
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: Radius.lg, // 16px
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingCard: { height: 60, marginBottom: 12 },
    trackingCardContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    trackingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    trackingDot: { width: 8, height: 8, borderRadius: 4 },
    cardColumn: {
        width: '100%',
        justifyContent: 'center',
    },
    cardContent: {
        alignItems: 'center',
        width: '100%',
    },
    cardText: {
        fontFamily: Typography.fontBodySemiBold,
        color: Colors.gray,
        marginTop: 16,
        fontSize: 16,
    },
    cardTextSecondary: {
        fontFamily: Typography.fontBody,
        color: Colors.gray,
        fontSize: 14,
    },
    progressBarBg: {
        width: '80%',
        height: 6,
        backgroundColor: Colors.grayDim,
        borderRadius: 3,
        marginTop: 20,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        width: '72%',
        height: '100%',
        backgroundColor: Colors.primary,
    },

    // Bottom Panel
    bottomSheet: {
        backgroundColor: Colors.surface, // #1A1A1A
        borderTopWidth: 1,
        borderTopColor: Colors.border, // #2A2A2A
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 28,
        paddingTop: 28,
        paddingBottom: 40,
        // Provide explicit height to make it consistent below illustrations
        height: height * 0.40,
    },
    textContent: {
        flex: 1,
    },
    title: {
        fontFamily: Typography.fontDisplayBold, // Syne_800ExtraBold
        fontSize: 22,
        color: Colors.white,
        lineHeight: 32,
        marginBottom: 16,
    },
    titleHighlight: {
        color: Colors.primary, // #FFD700
    },
    description: {
        fontFamily: Typography.fontBody, // Outfit_400Regular
        fontSize: 13,
        color: Colors.gray, // #8A8A8A
        lineHeight: 20,
    },

    // Controls Overlay
    controlsContainer: {
        position: 'absolute',
        bottom: 40,
        left: 28,
        right: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paginator: {
        flexDirection: 'row',
        height: 6,
        alignItems: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#333333',
        marginRight: 6,
    },
    buttonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    skipText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 14,
        color: Colors.gray,
    },
    nextButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary, // #FFD700
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.primaryGlow, // Uses the yellow glow token
    },
});
