import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { TitleInputModal } from './TitleInputModal';

interface DocumentUploadButtonProps {
    onUpload: (file: FormData, metadata: any) => Promise<void>;
    documentType: string;
    label?: string;
}

export function DocumentUploadButton({
    onUpload,
    documentType,
    label = 'Belge Yükle',
}: DocumentUploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<{ uri: string; fileName: string } | null>(null);

    const showUploadOptions = () => {
        Alert.alert(
            'Belge Yükle',
            'Lütfen yükleme yöntemini seçin',
            [
                {
                    text: 'Fotoğraf Çek',
                    onPress: () => pickImage('camera'),
                },
                {
                    text: 'Galeriden Seç',
                    onPress: () => pickImage('gallery'),
                },
                {
                    text: 'Dosya Seç',
                    onPress: () => pickDocument(),
                },
                {
                    text: 'İptal',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    };

    const pickImage = async (source: 'camera' | 'gallery') => {
        try {
            // Request permissions
            let permissionResult;
            if (source === 'camera') {
                permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            } else {
                permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            }

            if (permissionResult.status !== 'granted') {
                Alert.alert(
                    'İzin Gerekli',
                    'Lütfen uygulama ayarlarından kamera/galeri erişim izni verin.'
                );
                return;
            }

            // Pick image
            console.log('📸 Picking image from:', source);
            const result =
                source === 'camera'
                    ? await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                        allowsEditing: true,
                    })
                    : await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                        allowsEditing: true,
                    });

            if (!result.canceled && result.assets[0]) {
                // Show title modal
                setPendingFile({
                    uri: result.assets[0].uri,
                    fileName: result.assets[0].fileName || 'photo.jpg',
                });
                setShowTitleModal(true);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                // Show title modal
                setPendingFile({
                    uri: asset.uri,
                    fileName: asset.name,
                });
                setShowTitleModal(true);
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
        }
    };

    const handleTitleConfirm = async (customTitle: string) => {
        setShowTitleModal(false);

        if (!pendingFile) return;

        const fileName = customTitle && customTitle.trim()
            ? `${customTitle.trim()}.${pendingFile.fileName.split('.').pop()}`
            : pendingFile.fileName;

        await performUpload(pendingFile.uri, fileName);
        setPendingFile(null);
    };

    const handleTitleCancel = () => {
        setShowTitleModal(false);
        setPendingFile(null);
    };

    const performUpload = async (uri: string, fileName: string) => {
        setIsUploading(true);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', {
                uri,
                name: fileName,
                type: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            } as any);

            // Metadata for document record
            const metadata = {
                documentType,
                fileName,
                entityType: 'DRIVER',
            };

            await onUpload(formData, metadata);

            Alert.alert('Başarılı', 'Belge başarıyla yüklendi.');
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Hata', `Yükleme başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <TitleInputModal
                visible={showTitleModal}
                onCancel={handleTitleCancel}
                onConfirm={handleTitleConfirm}
            />

            <TouchableOpacity
                style={[styles.button, isUploading && styles.buttonDisabled]}
                onPress={showUploadOptions}
                disabled={isUploading}
            >
                {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>{label}</Text>
                    </>
                )}
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
