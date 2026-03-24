import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, SendHorizontal, AlertTriangle, MapPin } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
    fetchMyTicket,
    sendSupportMessage,
    closeMyTicket,
    addSupportMessage,
    ticketStatusChanged,
    SupportMessage,
} from '../../../store/slices/supportSlice';
import { api } from '../../../services/api';
import { websocketService } from '../../../services/websocket';
import { Colors, Typography } from '../../theme/tokens';

// ─── Öncelik tanımları ──────────────────────────────────────────────────────
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string; icon: string }[] = [
    { value: 'LOW',    label: 'Düşük',   color: '#4CAF50', icon: '●' },
    { value: 'NORMAL', label: 'Normal',  color: '#FFD700', icon: '●' },
    { value: 'HIGH',   label: 'Yüksek',  color: '#f59e0b', icon: '●' },
    { value: 'URGENT', label: '🚨 Acil', color: '#FF5252', icon: '⚠' },
];

const STATUS_LABEL: Record<string, string> = {
    OPEN:           'Açık',
    ASSIGNED:       'Atandı',
    WAITING_REPLY:  'Cevap Bekleniyor',
    IN_PROGRESS:    'Devam Ediyor',
    RESOLVED:       'Çözüldü',
    CLOSED:         'Kapalı',
};

const STATUS_COLOR: Record<string, string> = {
    OPEN:           Colors.primary,
    ASSIGNED:       Colors.primary,
    WAITING_REPLY:  '#f59e0b',
    IN_PROGRESS:    Colors.primary,
    RESOLVED:       Colors.success,
    CLOSED:         Colors.gray,
};

type ScreenStep = 'priority-select' | 'emergency-form' | 'chat';

export const SupportScreen = () => {
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const flatListRef = useRef<FlatList>(null);

    const { currentTicket, messages, isLoading, isSending } =
        useAppSelector((state) => state.support);
    const currentUser = useAppSelector((state) => state.auth.user);

    const [messageText, setMessageText] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<Priority>('NORMAL');
    const [step, setStep] = useState<ScreenStep>('priority-select');

    // Emergency form fields
    const [emergencyLocation, setEmergencyLocation] = useState('');
    const [emergencyDesc, setEmergencyDesc] = useState('');
    const [emergencyLoading, setEmergencyLoading] = useState(false);

    // ── WebSocket dinleyicileri ──────────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchMyTicket());

        const handleAdminReply = (data: any) => {
            const normalizedMessage: SupportMessage = {
                id:              data.messageId || data.id || `ws_${Date.now()}`,
                ticketId:        data.ticketId  || '',
                senderId:        data.sender?.id || '',
                sender:          data.sender     || { id: '', email: 'Destek', role: 'ADMIN' },
                content:         data.content    || '',
                isInternal:      false,
                isSystemMessage: false,
                createdAt:       data.timestamp  || data.createdAt || new Date().toISOString(),
            };
            dispatch(addSupportMessage(normalizedMessage));
            dispatch(fetchMyTicket());
        };

        const handleStatusChanged = (data: any) => {
            dispatch(ticketStatusChanged(data));
        };

        websocketService.onAdminReply(handleAdminReply);
        websocketService.onTicketStatusChanged(handleStatusChanged);

        return () => {
            websocketService.offAdminReply(handleAdminReply);
            websocketService.offTicketStatusChanged(handleStatusChanged);
        };
    }, [dispatch]);

    // Mevcut aktif ticket varsa direkt chat'e yönlendir
    useEffect(() => {
        if (currentTicket) {
            setStep('chat');
        }
    }, [currentTicket]);

    // ── Öncelik seç ─────────────────────────────────────────────────────────
    const handlePrioritySelect = (priority: Priority) => {
        setSelectedPriority(priority);
        if (priority === 'URGENT') {
            setStep('emergency-form');
        } else {
            setStep('chat');
        }
    };

    // ── Acil talep gönder ────────────────────────────────────────────────────
    const handleEmergencySubmit = async () => {
        if (!emergencyDesc.trim()) {
            Alert.alert('Eksik Bilgi', 'Lütfen durumu kısaca açıklayın.');
            return;
        }
        setEmergencyLoading(true);
        try {
            await api.createEmergencyTicket(
                emergencyLocation.trim() || undefined
            );
            // Ayrıca açıklama mesajı gönder
            await dispatch(sendSupportMessage({
                content: `🚨 ACİL: ${emergencyDesc.trim()}${emergencyLocation.trim() ? `\n📍 Konum: ${emergencyLocation.trim()}` : ''}`,
                priority: 'URGENT',
            })).unwrap();
            Alert.alert('Acil Talep Alındı', 'Ekibimiz en kısa sürede sizinle iletişime geçecek.');
            setStep('chat');
        } catch {
            Alert.alert('Hata', 'Acil talep gönderilemedi. Tekrar deneyin.');
        } finally {
            setEmergencyLoading(false);
        }
    };

    // ── Normal mesaj gönder ──────────────────────────────────────────────────
    const handleSend = async () => {
        if (!messageText.trim()) return;
        const content = messageText.trim();
        setMessageText('');
        try {
            await dispatch(
                sendSupportMessage({
                    content,
                    priority: currentTicket ? undefined : selectedPriority,
                })
            ).unwrap();
        } catch {
            Alert.alert('Hata', 'Mesaj gönderilemedi');
        }
    };

    // ── Ticket kapat ─────────────────────────────────────────────────────────
    const handleClose = () => {
        Alert.alert(
            'Talebi Kapat',
            'Sorununuz çözüldü mü? Destek talebi kapatılacak.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Kapat',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(closeMyTicket()).unwrap();
                            Alert.alert('Başarılı', 'Destek talebi kapatıldı.');
                            setStep('priority-select');
                            navigation.goBack();
                        } catch {
                            Alert.alert('Hata', 'Ticket kapatılamadı.');
                        }
                    },
                },
            ]
        );
    };

    // ── Mesaj render ─────────────────────────────────────────────────────────
    const renderMessage = ({ item }: { item: SupportMessage }) => {
        const isMe     = item.senderId === currentUser?.id;
        const isSystem = item.isSystemMessage;

        if (isSystem) {
            return (
                <View style={styles.systemMsg}>
                    <Text style={styles.systemMsgText}>{item.content}</Text>
                </View>
            );
        }

        const timeStr = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            : '';

        return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={styles.senderName}>
                    {isMe ? 'Ben' : item.sender?.email || 'Destek'}
                </Text>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                    {item.content}
                </Text>
                <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
                    {timeStr}
                </Text>
            </View>
        );
    };

    // ── Yükleniyor ───────────────────────────────────────────────────────────
    if (isLoading && !currentTicket && messages.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isClosed = currentTicket?.status === 'CLOSED' || currentTicket?.status === 'RESOLVED';
    const sortedMessages = [...messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // ═══════════════════════════════════════════════════════════════════════
    // ADIM 1: ÖNCELİK SEÇİCİ
    // ═══════════════════════════════════════════════════════════════════════
    if (step === 'priority-select') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={Colors.white} size={28} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <View style={styles.headerAvatar}>
                            <Text style={styles.headerAvatarText}>LT</Text>
                        </View>
                        <Text style={styles.headerTitle}>Destek Talebi Oluştur</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.priorityPage}>
                    <Text style={styles.priorityPageTitle}>Talebinizin Aciliyeti</Text>
                    <Text style={styles.priorityPageSub}>
                        Destek talebi oluşturmak için önce aciliyet seviyesini seçin.
                    </Text>

                    {PRIORITY_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.priorityCard, { borderColor: opt.color }]}
                            onPress={() => handlePrioritySelect(opt.value)}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.priorityDot, { backgroundColor: opt.color }]} />
                            <View style={styles.priorityCardText}>
                                <Text style={[styles.priorityCardLabel, { color: opt.color }]}>
                                    {opt.label}
                                </Text>
                                <Text style={styles.priorityCardDesc}>
                                    {opt.value === 'LOW'    && 'Acil değil, müsait olunduğunda bakılabilir'}
                                    {opt.value === 'NORMAL' && 'Standart destek talebi'}
                                    {opt.value === 'HIGH'   && 'Önemli, hızlı yanıt bekleniyor'}
                                    {opt.value === 'URGENT' && 'Tehlike veya acil durum — anında müdahale'}
                                </Text>
                            </View>
                            <Text style={[styles.priorityArrow, { color: opt.color }]}>›</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADIM 2: ACİL FORM
    // ═══════════════════════════════════════════════════════════════════════
    if (step === 'emergency-form') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setStep('priority-select')} style={styles.backBtn}>
                        <ChevronLeft color={Colors.white} size={28} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <View style={[styles.headerAvatar, { backgroundColor: '#FF5252' }]}>
                            <Text style={styles.headerAvatarText}>🚨</Text>
                        </View>
                        <Text style={styles.headerTitle}>Acil Destek</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView contentContainerStyle={styles.emergencyPage}>
                        <View style={styles.emergencyBanner}>
                            <AlertTriangle color="#FF5252" size={22} />
                            <Text style={styles.emergencyBannerText}>
                                Acil durum ekibimiz bildirim alacak ve en kısa sürede sizi arayacak.
                            </Text>
                        </View>

                        <Text style={styles.fieldLabel}>Durumu Açıklayın *</Text>
                        <TextInput
                            style={[styles.input, styles.inputMulti]}
                            value={emergencyDesc}
                            onChangeText={setEmergencyDesc}
                            placeholder="Ne oluyor? Kısaca açıklayın..."
                            placeholderTextColor={Colors.gray}
                            multiline
                            numberOfLines={4}
                            maxLength={300}
                        />

                        <Text style={styles.fieldLabel}>Konumunuz (opsiyonel)</Text>
                        <View style={styles.locationRow}>
                            <MapPin color={Colors.gray} size={16} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.input, styles.locationInput]}
                                value={emergencyLocation}
                                onChangeText={setEmergencyLocation}
                                placeholder="Adres, plaka, km..."
                                placeholderTextColor={Colors.gray}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.emergencyBtn, emergencyLoading && styles.emergencyBtnDisabled]}
                            onPress={handleEmergencySubmit}
                            disabled={emergencyLoading}
                            activeOpacity={0.8}
                        >
                            {emergencyLoading
                                ? <ActivityIndicator size="small" color={Colors.white} />
                                : <Text style={styles.emergencyBtnText}>🚨 Acil Yardım Talep Et</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setStep('priority-select')}
                        >
                            <Text style={styles.cancelBtnText}>Geri Dön</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADIM 3: CHAT
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => currentTicket ? navigation.goBack() : setStep('priority-select')}
                    style={styles.backBtn}
                >
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>LT</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Merkez Destek</Text>
                        {currentTicket && (
                            <Text style={styles.headerSub}>#{currentTicket.ticketNumber}</Text>
                        )}
                    </View>
                </View>
                {currentTicket && (
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[currentTicket.status] || Colors.gray }]}>
                        <Text style={styles.statusBadgeText}>
                            {STATUS_LABEL[currentTicket.status] || currentTicket.status}
                        </Text>
                    </View>
                )}
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <FlatList
                    ref={flatListRef}
                    data={sortedMessages}
                    keyExtractor={(item, index) => item.id || `msg_${index}`}
                    renderItem={renderMessage}
                    inverted
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                Henüz mesaj yok. İlk mesajı gönderin.
                            </Text>
                        </View>
                    }
                />

                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.inputField}
                        value={messageText}
                        onChangeText={setMessageText}
                        placeholder={isClosed ? 'Bu talep kapatılmıştır.' : 'Mesajınızı yazın...'}
                        placeholderTextColor={Colors.gray}
                        multiline
                        maxLength={500}
                        editable={!isClosed}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!messageText.trim() || isSending || isClosed) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!messageText.trim() || isSending || isClosed}
                    >
                        {isSending
                            ? <ActivityIndicator size="small" color={Colors.background} />
                            : <SendHorizontal color={messageText.trim() && !isClosed ? Colors.background : Colors.gray} size={20} />
                        }
                    </TouchableOpacity>
                </View>

                {currentTicket && !isClosed && (
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Text style={styles.closeBtnText}>Sorunum Çözüldü — Talebi Kapat</Text>
                    </TouchableOpacity>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ─── Stiller ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: Colors.background },
    flex:          { flex: 1 },
    center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText:   { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.gray, marginTop: 12 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surface,
    },
    backBtn:         { padding: 4 },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 12,
    },
    headerAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10,
    },
    headerAvatarText: { fontFamily: Typography.fontDisplayBold, fontSize: 13, color: Colors.background },
    headerTitle:      { fontFamily: Typography.fontDisplayBold, fontSize: 14, color: Colors.white },
    headerSub:        { fontFamily: Typography.fontBody, fontSize: 11, color: Colors.gray },
    statusBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
    statusBadgeText:  { fontFamily: Typography.fontBodySemiBold, fontSize: 11, color: Colors.white },

    // Priority selector page
    priorityPage: { padding: 24 },
    priorityPageTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 22,
        color: Colors.white,
        marginBottom: 8,
    },
    priorityPageSub: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        marginBottom: 32,
        lineHeight: 20,
    },
    priorityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    priorityDot:      { width: 12, height: 12, borderRadius: 6, marginRight: 14 },
    priorityCardText: { flex: 1 },
    priorityCardLabel: { fontFamily: Typography.fontBodySemiBold, fontSize: 15, marginBottom: 2 },
    priorityCardDesc:  { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.gray, lineHeight: 16 },
    priorityArrow:     { fontFamily: Typography.fontDisplayBold, fontSize: 24, marginLeft: 8 },

    // Emergency form
    emergencyPage: { padding: 24 },
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,82,82,0.12)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF5252',
        padding: 14,
        marginBottom: 24,
        gap: 10,
    },
    emergencyBannerText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: '#FF7070',
        flex: 1,
        lineHeight: 18,
    },
    fieldLabel: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 13,
        color: Colors.gray,
        marginBottom: 8,
        marginTop: 4,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputMulti:    { minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
    locationRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    locationInput: { flex: 1 },
    emergencyBtn: {
        backgroundColor: '#FF5252',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    emergencyBtnDisabled: { opacity: 0.6 },
    emergencyBtnText: { fontFamily: Typography.fontBodySemiBold, fontSize: 15, color: Colors.white },
    cancelBtn:    { alignItems: 'center', paddingVertical: 12 },
    cancelBtnText: { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.gray },

    // Chat
    listContent:  { paddingHorizontal: 12, paddingVertical: 16 },
    bubble:       { maxWidth: '80%', padding: 12, borderRadius: 14, marginVertical: 4 },
    bubbleMe:     { alignSelf: 'flex-end', backgroundColor: Colors.primary },
    bubbleThem:   { alignSelf: 'flex-start', backgroundColor: Colors.surface },
    senderName:   { fontFamily: Typography.fontBodySemiBold, fontSize: 11, color: Colors.gray, marginBottom: 4 },
    bubbleText:   { fontFamily: Typography.fontBody, fontSize: 14 },
    bubbleTextMe:   { color: Colors.background },
    bubbleTextThem: { color: Colors.white },
    bubbleTime:   { fontFamily: Typography.fontBody, fontSize: 10, marginTop: 4 },
    bubbleTimeMe:   { color: 'rgba(13,13,13,0.5)', textAlign: 'right' },
    bubbleTimeThem: { color: Colors.gray, textAlign: 'left' },

    systemMsg:     { alignItems: 'center', paddingVertical: 8 },
    systemMsgText: { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.gray },

    emptyState:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
    emptyText:   { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.gray, textAlign: 'center', lineHeight: 22 },

    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.surface,
        backgroundColor: Colors.background,
    },
    inputField: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 8,
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
        maxHeight: 100,
        minHeight: 44,
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: Colors.surface },

    closeBtn: {
        backgroundColor: Colors.success,
        paddingVertical: 12,
        margin: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeBtnText: { fontFamily: Typography.fontBodySemiBold, fontSize: 14, color: Colors.white },
});
