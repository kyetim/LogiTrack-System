'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, API_URL, STORAGE_KEYS } from '../../../../../utils/constants';
import SignaturePad from '../../../../../components/SignaturePad';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppDispatch } from '../../../../../store';
import { updateShipmentStatus } from '../../../../../store/slices/shipmentsSlice';
import { offlineStorage } from '../../../../../services/OfflineStorage';

export default function DeliveryProofScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [signatureUri, setSignatureUri] = useState<string | null>(null);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            router.replace('/(drawer)/(tabs)/shipments');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSignatureSave = (signature: string) => {
        setSignatureUri(signature);
        setShowSignaturePad(false);
    };

    const uploadFile = async (uri: string, type: 'photo' | 'signature'): Promise<string> => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        console.log(`📤 Uploading ${type}...`);

        // Handle Signature (Base64)
        if (type === 'signature') {
            try {
                const response = await fetch(`${API_URL}/upload/signature-base64`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ image: uri }),
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status}`);
                }

                const data = await response.json();
                console.log(`✅ Signature upload success:`, data);
                return data.url;
            } catch (error) {
                console.error(`Signature upload exception:`, error);
                throw error;
            }
        }

        // Handle Photo (Multipart File)
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'file.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
            uri,
            name: filename,
            type: fileType,
        } as any);

        try {
            const response = await fetch(`${API_URL}/upload/photo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type header is set automatically by fetch for FormData
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Upload error: ${response.status} - ${errorText}`);
                throw new Error(`Upload failed: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Photo upload success:`, data);
            return data.url;
        } catch (error: any) {
            console.error(`Photo upload exception:`, error);
            throw error;
        }
    };

    const copyToPermanentStorage = async (uri: string, prefix: string): Promise<string> => {
        const filename = `${prefix}_${Date.now()}.jpg`;
        const destUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({ from: uri, to: destUri });
        return destUri;
    };

    const handleSubmit = async () => {
        if (!photoUri && !signatureUri) {
            Alert.alert('Eksik Bilgi', 'Lütfen fotoğraf çekin veya imza alın.');
            return;
        }

        setIsSubmitting(true);

        try {
            const netState = await NetInfo.fetch();
            const isConnected = netState.isConnected === true && netState.isInternetReachable !== false;

            // Permanent storage if offline or queueing
            const permanentPhotoUrl = photoUri ? await copyToPermanentStorage(photoUri, 'photo') : undefined;
            const permanentSignatureUrl = signatureUri ? await copyToPermanentStorage(signatureUri, 'signature') : undefined;

            if (isConnected) {
                // ONLINE: Upload immediately
                const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                let finalPhotoUrl: string | undefined;
                let finalSignatureUrl: string | undefined;

                if (permanentPhotoUrl) finalPhotoUrl = await uploadFile(permanentPhotoUrl, 'photo');
                if (permanentSignatureUrl) finalSignatureUrl = await uploadFile(permanentSignatureUrl, 'signature');

                const response = await fetch(`${API_URL}/shipments/${id}/delivery-proof`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        photoUrl: finalPhotoUrl,
                        signatureUrl: finalSignatureUrl,
                        recipientName: recipientName || undefined,
                        notes: notes || undefined,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Delivery proof error:', response.status, errorData);
                    throw new Error(errorData.message || 'Teslimat kanıtı eklenemedi.');
                }

                // Set status to DELIVERED in Redux since we did it manually via API
                await dispatch(updateShipmentStatus({ id: id as string, status: 'DELIVERED' })).unwrap();

            } else {
                // OFFLINE: Queue action and dispatch optimistic update
                console.log('📶 Şoför çevrimdışı, Teslimat kanıtı kuyruğa alınıyor...');

                await offlineStorage.savePendingAction('COMPLETE_DELIVERY', {
                    shipmentId: id,
                    status: 'DELIVERED',
                    photoUrl: permanentPhotoUrl,
                    signatureUrl: permanentSignatureUrl,
                    recipientName: recipientName || undefined,
                    notes: notes || undefined,
                });

                // Optimistic Update
                dispatch(updateShipmentStatus({ id: id as string, status: 'DELIVERED' }));
                Alert.alert(
                    'Çevrimdışı',
                    'İnternet bağlantınız yok. Teslimat başarıyla yerel olarak kaydedildi, bağlantı geldiğinde sunucuya aktarılacak.',
                    [{ text: 'Tamam', onPress: () => router.back() }]
                );
                return;
            }

            Alert.alert('Başarılı', 'Teslimat kanıtı başarıyla kaydedildi.', [
                { text: 'Tamam', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Submit error:', error);
            Alert.alert('Hata', error.message || 'Teslimat kanıtı gönderilirken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Teslimat Kanıtı</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Photo Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fotoğraf</Text>
                    {photoUri ? (
                        <View style={styles.photoContainer}>
                            <Image source={{ uri: photoUri }} style={styles.photo} />
                            <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
                                <MaterialCommunityIcons name="camera-retake" size={20} color="white" />
                                <Text style={styles.retakeText}>Yeniden Çek</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                            <MaterialCommunityIcons name="camera" size={48} color={COLORS.primary} />
                            <Text style={styles.captureText}>Fotoğraf Çek</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Signature Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>İmza</Text>
                    {signatureUri ? (
                        <View style={styles.photoContainer}>
                            <Image source={{ uri: signatureUri }} style={styles.signatureImage} />
                            <TouchableOpacity style={styles.retakeButton} onPress={() => setShowSignaturePad(true)}>
                                <MaterialCommunityIcons name="draw" size={20} color="white" />
                                <Text style={styles.retakeText}>Yeniden Al</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.signatureButton} onPress={() => setShowSignaturePad(true)}>
                            <MaterialCommunityIcons name="draw" size={24} color={COLORS.primary} />
                            <Text style={styles.signatureButtonText}>İmza Al</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Recipient Name */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Teslim Alan Kişi</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="İsim Soyisim"
                        value={recipientName}
                        onChangeText={setRecipientName}
                    />
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notlar (Opsiyonel)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Teslimat hakkında notlar..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                            <Text style={styles.submitText}>Teslimatı Tamamla</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Signature Pad Modal */}
            <SignaturePad
                visible={showSignaturePad}
                onClose={() => setShowSignaturePad(false)}
                onSave={handleSignatureSave}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    captureButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    captureText: {
        marginTop: 8,
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '500',
    },
    photoContainer: {
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: 300,
        borderRadius: 12,
    },
    signatureImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: 'white',
    },
    retakeButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    retakeText: {
        color: 'white',
        fontWeight: '600',
    },
    signatureButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    signatureButtonText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: COLORS.success,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
