import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Message } from '../../types';

interface ChatBubbleProps {
    message: Message;
    isCurrentUser: boolean;
}

export function ChatBubble({ message, isCurrentUser }: ChatBubbleProps) {
    return (
        <View style={[
            styles.container,
            isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
        ]}>
            <View style={[
                styles.bubble,
                isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
            ]}>
                <Text style={[
                    styles.text,
                    isCurrentUser ? styles.currentUserText : styles.otherUserText
                ]}>
                    {message.content}
                </Text>

                <View style={styles.metaContainer}>
                    <Text style={[
                        styles.timestamp,
                        isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
                    ]}>
                        {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>

                    {isCurrentUser && (
                        <Text style={styles.readIndicator}>
                            {message.read ? '✓✓' : '✓'}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        paddingHorizontal: 12,
    },
    currentUserContainer: {
        alignItems: 'flex-end',
    },
    otherUserContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    currentUserBubble: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    otherUserBubble: {
        backgroundColor: '#E5E5EA',
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
        lineHeight: 20,
    },
    currentUserText: {
        color: '#FFFFFF',
    },
    otherUserText: {
        color: '#000000',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    timestamp: {
        fontSize: 11,
    },
    currentUserTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherUserTimestamp: {
        color: 'rgba(0, 0, 0, 0.5)',
    },
    readIndicator: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
    },
});
