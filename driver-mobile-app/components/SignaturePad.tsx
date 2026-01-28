'use client';

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

interface SignaturePadProps {
    visible: boolean;
    onClose: () => void;
    onSave: (signature: string) => void;
}

export default function SignaturePad({ visible, onClose, onSave }: SignaturePadProps) {
    const ref = useRef<any>();
    const [isEmpty, setIsEmpty] = useState(true);

    const handleSignature = (signature: string) => {
        onSave(signature);
        onClose();
    };

    const handleClear = () => {
        ref.current?.clearSignature();
        setIsEmpty(true);
    };

    const handleEnd = () => {
        setIsEmpty(false);
    };

    const handleSave = () => {
        ref.current?.readSignature();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>İmza</Text>
                    <TouchableOpacity onPress={handleClear}>
                        <Text style={styles.clearText}>Temizle</Text>
                    </TouchableOpacity>
                </View>

                {/* Signature Canvas */}
                <View style={styles.canvasContainer}>
                    <SignatureCanvas
                        ref={ref}
                        onEnd={handleEnd}
                        onOK={handleSignature}
                        descriptionText="İmzanızı buraya atın"
                        clearText="Temizle"
                        confirmText="Kaydet"
                        webStyle={`
                            .m-signature-pad {
                                box-shadow: none;
                                border: 2px dashed ${COLORS.border};
                                border-radius: 12px;
                            }
                            .m-signature-pad--body {
                                border: none;
                            }
                            .m-signature-pad--footer {
                                display: none;
                            }
                        `}
                    />
                </View>

                {/* Instructions */}
                <Text style={styles.instructions}>
                    Parmağınızla yukarıdaki alana imza atın
                </Text>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isEmpty && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isEmpty}
                >
                    <MaterialCommunityIcons name="check" size={24} color="white" />
                    <Text style={styles.saveText}>İmzayı Kaydet</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    clearText: {
        fontSize: 16,
        color: COLORS.danger,
        fontWeight: '500',
    },
    canvasContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    instructions: {
        textAlign: 'center',
        color: COLORS.textLight,
        fontSize: 14,
        marginBottom: 16,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
