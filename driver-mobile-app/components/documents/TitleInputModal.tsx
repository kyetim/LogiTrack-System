import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface TitleInputModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (title: string) => void;
}

export function TitleInputModal({ visible, onCancel, onConfirm }: TitleInputModalProps) {
    const [title, setTitle] = useState('');

    const handleConfirm = () => {
        onConfirm(title.trim());
        setTitle(''); // Reset
    };

    const handleCancel = () => {
        setTitle(''); // Reset
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Belge Başlığı</Text>
                    <Text style={styles.subtitle}>
                        Bu belge için bir başlık girin (opsiyonel)
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Örn: Ehliyet, Sigorta 2024"
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleConfirm}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelText}>İptal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmText}>Yükle</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: '600',
        color: Colors.gray900,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.gray200,
        borderRadius: 8,
        padding: Spacing.md,
        fontSize: Typography.base,
        marginBottom: Spacing.lg,
        backgroundColor: Colors.background,
    },
    buttons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.gray100,
    },
    confirmButton: {
        backgroundColor: Colors.primary,
    },
    cancelText: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    confirmText: {
        fontSize: Typography.base,
        fontWeight: '600',
        color: Colors.white,
    },
});
