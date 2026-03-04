import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Phone, SendHorizontal } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography } from '@/theme/tokens';
import { ChatMessage } from '@/types';
import { useAppDispatch, useAppSelector } from '../../../store';
import { sendMessage, fetchMessages } from '../../../store/slices/messagesSlice';
import { websocketService } from '../../../services/websocket';

type SupportNavProp = NativeStackNavigationProp<MainStackParamList, 'Support'>;

// Typewriter pulse animation for the typing indicator
const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const createAnimation = (anim: Animated.Value, delay: number) => {
            return Animated.sequence([
                Animated.delay(delay),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0.3,
                            duration: 400,
                            useNativeDriver: true,
                        })
                    ])
                )
            ]);
        };

        Animated.parallel([
            createAnimation(dot1, 0),
            createAnimation(dot2, 200),
            createAnimation(dot3, 400),
        ]).start();
    }, []);

    return (
        <View style={styles.typingContainer}>
            <View style={styles.supportAvatarSmall}>
                <Text style={styles.supportAvatarTextSmall}>LT</Text>
            </View>
            <View style={styles.typingBubble}>
                <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
                <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
                <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
            </View>
        </View>
    );
};

export const SupportScreen = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();

    // Redux selectors
    const user = useAppSelector((state: any) => state.auth.user);
    const token = useAppSelector((state: any) => state.auth.token);
    const reduxMessages = useAppSelector((state: any) => state.messages.currentMessages);

    // We reverse the array because FlatList inverted=true renders from bottom up but consumes the array index 0 at the bottom.
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Convert Redux messages to Local ChatMessage type (handling API shape differences if any)
    useEffect(() => {
        if (!reduxMessages) return;

        const mapped: ChatMessage[] = reduxMessages.map((rm: any) => ({
            id: rm.id,
            text: rm.content,
            sender: rm.senderId === user?.id ? 'driver' : 'support',
            time: new Date(rm.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        }));

        setMessages([...mapped].reverse());
    }, [reduxMessages, user?.id]);

    // WebSocket Connection lifecycle
    useEffect(() => {
        if (!user || !user.id || !token) return;

        // The websocket service internally reads from AsyncStorage
        // so it takes 0 arguments in its signature
        websocketService.connect();
        setIsConnected(true);

        return () => {
            websocketService.disconnect();
            setIsConnected(false);
        };
    }, [user, token]);

    const autoReplies = [
        "Anladım, konuya bakıyorum.",
        "Yardımcı olmaktan memnuniyet duyarım!",
        "Birkaç dakika içinde size dönüş yapacağız.",
        "Sistemi kontrol edip hemen bilgi veriyorum.",
    ];

    const generateId = () => Math.random().toString(36).substring(2, 9);

    const getCurrentTime = () => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        // Sadece tek bir kurgusal id, asıl id'yi backend verecek
        const tempId = `temp_${Math.random().toString(36).substring(2, 9)}`;

        const newMsg: ChatMessage = {
            id: tempId,
            text: inputText.trim(),
            sender: 'driver',
            time: getCurrentTime(),
        };

        // Add to local state instantly for fast UI feedback
        setMessages(prev => [newMsg, ...prev]);
        setInputText('');

        // Gerçek API Dispatch
        // Not: Mesaj doğrudan "Admin" ya da "Destek Ekibi" ID'sine gönderilmeli 
        // ancak recipientId'yi burada varsayılan "admin" olarak yolluyoruz.
        dispatch(sendMessage({ recipientId: 'admin', content: newMsg.text }));
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isSupport = item.sender === 'support';

        return (
            <View style={[styles.messageRow, isSupport ? styles.messageRowLeft : styles.messageRowRight]}>
                {isSupport && (
                    <View style={styles.supportAvatarSmall}>
                        <Text style={styles.supportAvatarTextSmall}>LT</Text>
                    </View>
                )}

                <View style={styles.messageContent}>
                    <View style={[styles.bubble, isSupport ? styles.bubbleLeft : styles.bubbleRight]}>
                        <Text style={[styles.messageText, isSupport ? styles.messageTextLeft : styles.messageTextRight]}>
                            {item.text}
                        </Text>
                    </View>
                    <Text style={[styles.timestamp, isSupport ? styles.timestampLeft : styles.timestampRight]}>
                        {item.time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>LT</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Logitrack Destek</Text>
                        <Text style={styles.headerSubtitle}>Çevrimiçi</Text>
                    </View>
                </View>

                <TouchableOpacity activeOpacity={0.8} style={styles.phoneBtn}>
                    <Phone color={Colors.white} size={22} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAware}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* ─── MESAJ LİSTESİ ─── */}
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    inverted
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
                />

                {/* ─── GİRİŞ ALANI ─── */}
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Mesaj yazın..."
                        placeholderTextColor="#444"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <SendHorizontal
                            color={inputText.trim() ? '#000' : '#8A8A8A'}
                            size={20}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },
    backBtn: {
        padding: 4,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 16,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerAvatarText: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 14,
        color: '#000',
    },
    headerTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 14,
        color: Colors.white,
    },
    headerSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 11,
        color: Colors.success,
    },
    phoneBtn: {
        padding: 4,
    },
    keyboardAware: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    supportAvatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    supportAvatarTextSmall: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 11,
        color: '#000',
    },
    messageContent: {
        maxWidth: '75%',
    },
    bubble: {
        padding: 12,
        marginBottom: 4,
    },
    bubbleLeft: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
    },
    bubbleRight: {
        backgroundColor: Colors.primary,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        lineHeight: 20,
    },
    messageTextLeft: {
        color: Colors.white,
    },
    messageTextRight: {
        color: '#000',
    },
    timestamp: {
        fontFamily: Typography.fontBody,
        fontSize: 10,
        color: '#555',
    },
    timestampLeft: {
        textAlign: 'left',
    },
    timestampRight: {
        textAlign: 'right',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    typingBubble: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#8A8A8A',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#0D0D0D',
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
        padding: 12,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
        maxHeight: 100, // Roughly 4 lines
        minHeight: 44, // Matches the button
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#1A1A1A',
    },
});
