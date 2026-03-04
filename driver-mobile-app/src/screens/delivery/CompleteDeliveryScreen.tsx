import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Star } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography } from '@/theme/tokens';
import { mockActiveDelivery } from '@/data/mockData';
import { AppButton } from '@/components/ui';

type CompleteDeliveryNavProp = NativeStackNavigationProp<MainStackParamList, 'CompleteDelivery'>;

export const CompleteDeliveryScreen = () => {
    const navigation = useNavigation<CompleteDeliveryNavProp>();

    // State
    const [showRating, setShowRating] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const checkOpacityAnim = useRef(new Animated.Value(0)).current;
    const textOpacityAnim = useRef(new Animated.Value(0)).current;
    const cardOpacityAnim = useRef(new Animated.Value(0)).current;
    const ratingSlideAnim = useRef(new Animated.Value(50)).current;
    const ratingOpacityAnim = useRef(new Animated.Value(0)).current;

    // Array of animated values for stars to achieve independent bounce effect
    const starScaleAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

    useEffect(() => {
        // Timeline animations on mount
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            }),
            // 2. İç Check Opacity
            Animated.timing(checkOpacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            // 3. Yazı Opacity
            Animated.timing(textOpacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            // 4. Kart Opacity
            Animated.timing(cardOpacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();

        // Show Rating block after 1.5s
        const timer = setTimeout(() => {
            setShowRating(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (showRating) {
            Animated.parallel([
                Animated.timing(ratingOpacityAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(ratingSlideAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [showRating]);

    const handleStarPress = (index: number) => {
        if (ratingSubmitted) return;

        setSelectedRating(index + 1);

        // Bounce Animation
        Animated.sequence([
            Animated.timing(starScaleAnims[index], {
                toValue: 1.3,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(starScaleAnims[index], {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleReturnToMain = () => {
        // Force replace to the Tab root to reset stack stack
        // Using "MainTabs" as fallback assuming our TabNavigator root name
        navigation.replace('MainTabs' as any);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* Background Overlay */}
            <View style={styles.bgOverlay} />

            {/* ─── BAŞARI ANİMASYONU ─── */}
            <View style={styles.animationContainer}>
                <Animated.View style={[styles.outerCircle, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.innerCircle}>
                        <Animated.View style={{ opacity: checkOpacityAnim }}>
                            <Check color={Colors.primary} size={48} strokeWidth={3} />
                        </Animated.View>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: textOpacityAnim, alignItems: 'center' }}>
                    <Text style={styles.successTitle}>Teslimat Tamamlandı!</Text>
                    <Text style={styles.successSubtitle}>
                        #{mockActiveDelivery.id.slice(-6)} numaralı teslimatınız{'\n'}başarıyla teslim edildi.
                    </Text>
                </Animated.View>
            </View>

            {/* ─── TESLİMAT ÖZET KARTI ─── */}
            <Animated.View style={[styles.summaryCard, { opacity: cardOpacityAnim }]}>
                <View style={styles.summaryCol}>
                    <Text style={styles.summaryColLabel}>Mesafe</Text>
                    <Text style={styles.summaryColValue}>4.2 km</Text>
                </View>
                <View style={styles.colDivider} />
                <View style={styles.summaryCol}>
                    <Text style={styles.summaryColLabel}>Süre</Text>
                    <Text style={styles.summaryColValue}>38 dk</Text>
                </View>
                <View style={styles.colDivider} />
                <View style={styles.summaryCol}>
                    <Text style={styles.summaryColLabel}>Kazanç</Text>
                    <Text style={[styles.summaryColValue, { color: Colors.primary }]}>
                        {mockActiveDelivery.price}
                    </Text>
                </View>
            </Animated.View>

            {/* ─── MÜŞTERİ DEĞERLENDİRME ─── */}
            {showRating && (
                <Animated.View
                    style={[
                        styles.ratingCard,
                        {
                            opacity: ratingOpacityAnim,
                            transform: [{ translateY: ratingSlideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.ratingTitle}>Sürücü Deneyimini Değerlendir</Text>
                    <Text style={styles.ratingSubtitle}>Teslimat deneyiminiz nasıldı?</Text>

                    <View style={styles.starsRow}>
                        {[...Array(5)].map((_, i) => (
                            <TouchableOpacity
                                key={`star-${i}`}
                                activeOpacity={0.8}
                                onPress={() => handleStarPress(i)}
                                disabled={ratingSubmitted}
                            >
                                <Animated.View style={{ transform: [{ scale: starScaleAnims[i] }] }}>
                                    <Star
                                        color={selectedRating > i ? Colors.primary : '#3A3A3A'}
                                        fill={selectedRating > i ? Colors.primary : 'transparent'}
                                        size={40}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {ratingSubmitted ? (
                        <View style={styles.ratingSuccessBox}>
                            <Text style={styles.ratingSuccessText}>Teşekkürler! ⭐</Text>
                        </View>
                    ) : (
                        <View style={{ height: 48, justifyContent: 'center' }}>
                            {selectedRating > 0 && (
                                <AppButton
                                    variant="primary"
                                    title="Değerlendirmeyi Gönder"
                                    onPress={() => setRatingSubmitted(true)}
                                    size="sm"
                                />
                            )}
                        </View>
                    )}
                </Animated.View>
            )}

            {/* ─── ALT BUTONLAR ─── */}
            <View style={styles.bottomActions}>
                <AppButton
                    variant="primary"
                    title="Yeni İş Bul"
                    onPress={handleReturnToMain}
                />
                <AppButton
                    variant="outline"
                    title="Ana Sayfaya Dön"
                    onPress={handleReturnToMain}
                />
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,215,0,0.06)',
        height: '40%', // Covers top 40%
    },
    animationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    outerCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background, // overlap background
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    innerCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255,215,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 24,
        color: Colors.white,
        marginTop: 32,
        marginBottom: 8,
    },
    successSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    summaryCol: {
        flex: 1,
        alignItems: 'center',
    },
    colDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#2A2A2A',
    },
    summaryColLabel: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 4,
    },
    summaryColValue: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 18,
        color: Colors.white,
    },
    ratingCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 24,
        marginBottom: 24,
    },
    ratingTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 15,
        color: Colors.white,
        textAlign: 'center',
        marginBottom: 4,
    },
    ratingSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        textAlign: 'center',
        marginBottom: 20,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    ratingSuccessBox: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 12,
    },
    ratingSuccessText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 14,
        color: '#4CAF50',
    },
    bottomActions: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
    },
});
