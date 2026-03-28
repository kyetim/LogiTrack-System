import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
    onSend: (message: string) => void;
    onTyping?: () => void;
    onStopTyping?: () => void;
    placeholder?: string;
    disabled?: boolean;
}

export function ChatInput({
    onSend,
    onTyping,
    onStopTyping,
    placeholder = 'Mesaj yazın...',
    disabled = false,
}: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const handleChangeText = (text: string) => {
        setMessage(text);

        // Typing indicator logic
        if (text.length > 0 && !isTyping) {
            setIsTyping(true);
            onTyping?.();
        } else if (text.length === 0 && isTyping) {
            setIsTyping(false);
            onStopTyping?.();
        }
    };

    const handleSend = () => {
        if (message.trim().length > 0) {
            onSend(message.trim());
            setMessage('');
            setIsTyping(false);
            onStopTyping?.();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            enabled={Platform.OS === 'ios'}
        >
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={handleChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#8E8E93"
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                />

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        message.trim().length === 0 && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={disabled || message.trim().length === 0}
                >
                    <Ionicons
                        name="send"
                        size={20}
                        color={message.trim().length > 0 ? '#FFFFFF' : '#C7C7CC'}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        fontSize: 16,
        color: '#000000',
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#F2F2F7',
    },
});
