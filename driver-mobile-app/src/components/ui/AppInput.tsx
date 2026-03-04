import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardTypeOptions,
    ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors, Typography, FontSizes, Radius } from '@/theme/tokens';

export interface AppInputProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    icon: React.ReactNode;
    secureTextEntry?: boolean;
    showToggle?: boolean;
    keyboardType?: KeyboardTypeOptions;
    rightElement?: React.ReactNode;
    error?: string;
    style?: ViewStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    icon,
    secureTextEntry = false,
    showToggle = false,
    keyboardType = 'default',
    rightElement,
    error,
    style,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordHidden, setIsPasswordHidden] = useState(secureTextEntry);

    const isError = Boolean(error);
    // Determine border color based on state
    const borderColor = isError
        ? Colors.error
        : isFocused
            ? Colors.borderFocus
            : Colors.border;

    return (
        <View style={[styles.container, style]}>
            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Input wrapper */}
            <View
                style={[
                    styles.inputContainer,
                    { borderColor },
                ]}
            >
                {/* Left Icon Container */}
                <View style={styles.leftIconContainer}>{icon}</View>

                {/* Text Input */}
                <TextInput
                    style={[
                        styles.input,
                        { paddingRight: showToggle || rightElement ? 42 : 14 }
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor="#444444" // Value defined in prompt
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={isPasswordHidden}
                    keyboardType={keyboardType}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    selectionColor={Colors.primary}
                    autoCapitalize="none"
                />

                {/* Right Element / Password Toggle */}
                {(showToggle || rightElement) && (
                    <View style={styles.rightIconContainer}>
                        {showToggle ? (
                            <TouchableOpacity
                                onPress={() => setIsPasswordHidden(!isPasswordHidden)}
                                activeOpacity={0.8}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Easier touch target
                            >
                                {isPasswordHidden ? (
                                    <EyeOff color={Colors.gray} size={18} strokeWidth={2} />
                                ) : (
                                    <Eye color={Colors.gray} size={18} strokeWidth={2} />
                                )}
                            </TouchableOpacity>
                        ) : (
                            rightElement
                        )}
                    </View>
                )}
            </View>

            {/* Error Message */}
            {isError && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8, // Using explicit 8px spacing
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderRadius: 14,
        height: 52, // Standard height for Logitrack dark inputs
    },
    leftIconContainer: {
        position: 'absolute',
        left: 14, // padding-left 14 from prompt
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontFamily: Typography.fontBody,
        fontSize: FontSizes.base, // 14px
        color: Colors.white,
        paddingLeft: 42, // Account for absolute positioned icon
        paddingRight: 14,
        paddingTop: 14,
        paddingBottom: 14,
        minHeight: 52,
    },
    rightIconContainer: {
        position: 'absolute',
        right: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    errorText: {
        fontFamily: Typography.fontBody,
        fontSize: FontSizes.sm, // 12px
        color: Colors.error,
        marginTop: 6,
        marginLeft: 4,
    },
});
