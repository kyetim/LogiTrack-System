import React, { useEffect } from 'react';
import { StyleSheet, Text, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Typography } from '@/theme/tokens';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export const ToastNotification: React.FC<ToastProps> = ({
    message,
    type = 'info',
    isVisible,
    onDismiss
}) => {
    const translateY = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.spring(translateY, {
                toValue: 50, // slide down to SafeArea top margin roughly
                useNativeDriver: true,
                bounciness: 12,
            }).start();

            const timer = setTimeout(() => {
                handleDismiss();
            }, 4000);

            return () => clearTimeout(timer);
        } else {
            Animated.timing(translateY, {
                toValue: -150,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    const handleDismiss = () => {
        Animated.timing(translateY, {
            toValue: -150,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onDismiss();
        });
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'warning': return '#FF9800';
            case 'error': return '#FF5252';
            case 'info':
            default: return '#FFD700'; // Primary/Info
        }
    };

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [{ translateY }],
                borderColor: getBorderColor(),
            }
        ]}>
            <Text style={styles.messageText}>{message}</Text>
            <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <X color={Colors.gray} size={20} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        width: width - 40,
        backgroundColor: '#1A1A1A',
        borderLeftWidth: 4,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    messageText: {
        flex: 1,
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.white,
        marginRight: 12,
    },
});
