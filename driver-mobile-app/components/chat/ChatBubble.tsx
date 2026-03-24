import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types';
import { Colors, Typography } from '../../src/theme/tokens';

interface ChatBubbleProps {
    message: Message;
    isCurrentUser: boolean;
}

export function ChatBubble({ message, isCurrentUser }: ChatBubbleProps) {
    const timeStr = new Date(message.createdAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <View style={[styles.container, isCurrentUser ? styles.containerMe : styles.containerThem]}>
            <View style={[styles.bubble, isCurrentUser ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.text, isCurrentUser ? styles.textMe : styles.textThem]}>
                    {message.content}
                </Text>
                <View style={styles.meta}>
                    <Text style={[styles.time, isCurrentUser ? styles.timeMe : styles.timeThem]}>
                        {timeStr}
                    </Text>
                    {isCurrentUser && (
                        <Text style={styles.readIndicator}>
                            {message.read ? ' ✓✓' : ' ✓'}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container:      { marginVertical: 4, paddingHorizontal: 12 },
    containerMe:    { alignItems: 'flex-end' },
    containerThem:  { alignItems: 'flex-start' },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    bubbleMe:   { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    bubbleThem: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
    text: { fontFamily: Typography.fontBody, fontSize: 14, lineHeight: 20 },
    textMe:     { color: Colors.background },
    textThem:   { color: Colors.white },
    meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    time: { fontFamily: Typography.fontBody, fontSize: 10 },
    timeMe:     { color: 'rgba(13,13,13,0.6)' },
    timeThem:   { color: Colors.gray },
    readIndicator: { fontSize: 10, color: 'rgba(13,13,13,0.6)' },
});
