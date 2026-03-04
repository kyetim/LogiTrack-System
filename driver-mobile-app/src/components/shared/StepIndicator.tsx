import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/theme/tokens';
import Svg, { Path } from 'react-native-svg';

export interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
}

export const StepIndicator = memo<StepIndicatorProps>(({ steps, currentStep }) => {
    return (
        <View style={styles.container}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const isUpcoming = index > currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <React.Fragment key={step}>
                        <View style={styles.stepItem}>
                            {/* Circle */}
                            <View
                                style={[
                                    styles.circle,
                                    isCompleted && styles.circleCompleted,
                                    isActive && styles.circleActive,
                                    isUpcoming && styles.circleUpcoming,
                                ]}
                            >
                                {isCompleted ? (
                                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <Path d="M20 6L9 17l-5-5" />
                                    </Svg>
                                ) : (
                                    <Text
                                        style={[
                                            styles.numberText,
                                            isActive && styles.numberTextActive,
                                            isUpcoming && styles.numberTextUpcoming,
                                        ]}
                                    >
                                        {index + 1}
                                    </Text>
                                )}
                            </View>

                            {/* Label */}
                            <Text
                                style={[
                                    styles.labelText,
                                    isCompleted && styles.labelCompleted,
                                    isActive && styles.labelActive,
                                    isUpcoming && styles.labelUpcoming,
                                ]}
                            >
                                {step}
                            </Text>
                        </View>

                        {/* Connecting Line */}
                        {!isLast && (
                            <View style={styles.lineContainer}>
                                <View style={[
                                    styles.line,
                                    {
                                        backgroundColor: isCompleted ? Colors.primary : '#3A3A3A',
                                    }
                                ]} />
                            </View>
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
});

StepIndicator.displayName = 'StepIndicator';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    stepItem: {
        alignItems: 'center',
        gap: 8,
        width: 60,
    },
    circle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleCompleted: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        borderWidth: 1,
    },
    circleActive: {
        backgroundColor: 'transparent',
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    circleUpcoming: {
        backgroundColor: 'transparent',
        borderColor: '#3A3A3A',
        borderWidth: 1.5,
    },
    numberText: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 12,
    },
    numberTextActive: {
        color: Colors.primary,
    },
    numberTextUpcoming: {
        color: '#3A3A3A',
    },
    labelText: {
        fontSize: 11,
        textAlign: 'center',
    },
    labelCompleted: {
        fontFamily: Typography.fontBodyMedium,
        color: Colors.primary,
    },
    labelActive: {
        fontFamily: Typography.fontBodySemiBold,
        color: Colors.primary,
    },
    labelUpcoming: {
        fontFamily: Typography.fontBody,
        color: '#555',
    },
    lineContainer: {
        flex: 1,
        height: 28,
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    line: {
        height: 2,
        borderRadius: 1,
        width: '100%',
    },
});
