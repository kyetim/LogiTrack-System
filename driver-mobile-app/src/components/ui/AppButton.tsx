import React, { useRef } from 'react';
import {
    Text,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Pressable,
} from 'react-native';
import { Colors, Typography, FontSizes, Shadows, Radius } from '@/theme/tokens';

export interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
}) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
        }).start();
    };

    // Base Size Styles
    const sizeStyles = {
        sm: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 13 },
        md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: FontSizes.base }, // 14px mapped to 15px logic, let's use explicit 15
        lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17 },
    };

    const currentSize = sizeStyles[size];

    // Variant Styles
    let backgroundColor: string = Colors.primary;
    let textColor: string = '#000000';
    let fontFamily: string = Typography.fontDisplay;
    let borderColor: string = 'transparent';
    let borderWidth: number = 0;
    let shadow: any = undefined;
    let borderRadius: number = Radius.pill;

    if (variant === 'primary') {
        backgroundColor = Colors.primary;
        textColor = '#000000';
        fontFamily = Typography.fontDisplay; // Syne_700Bold
        shadow = Shadows.primaryGlow;
    } else if (variant === 'ghost') {
        backgroundColor = 'transparent';
        textColor = Colors.primary; // #FFD700
        fontFamily = Typography.fontBodyMedium; // Outfit_500Medium
        shadow = undefined;
    } else if (variant === 'outline') {
        backgroundColor = 'transparent';
        borderColor = Colors.border; // #2A2A2A
        borderWidth = 1.5;
        textColor = Colors.white; // #FFFFFF
        fontFamily = Typography.fontBodyMedium;
        shadow = undefined;
    }

    // Disabled State
    const opacity = disabled ? 0.5 : 1;

    // Render logic for ActivityIndicator color
    const indicatorColor = variant === 'primary' ? '#000' : Colors.primary;

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleValue }], width: fullWidth ? '100%' : 'auto' },
            ]}
        >
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[
                    styles.container,
                    {
                        backgroundColor,
                        borderColor,
                        borderWidth,
                        borderRadius,
                        paddingVertical: currentSize.paddingVertical,
                        paddingHorizontal: currentSize.paddingHorizontal,
                        opacity,
                        ...(shadow as object),
                    },
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={indicatorColor} />
                ) : (
                    <Text
                        style={[
                            {
                                color: textColor,
                                fontFamily,
                                fontSize: size === 'md' ? 15 : currentSize.fontSize, // Prompt specifically asked 15px for md
                                textAlign: 'center',
                            },
                        ]}
                    >
                        {title}
                    </Text>
                )}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
