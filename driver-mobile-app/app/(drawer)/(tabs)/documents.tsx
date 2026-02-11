import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
    Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchDocuments, deleteDocument } from '../../../store/slices/documentsSlice';
import { DocumentCard } from '../../../components/documents/DocumentCard';
import { DocumentUploadButton } from '../../../components/documents/DocumentUploadButton';
import { Colors, Spacing, Typography } from '../../../constants/theme';
import { api } from '../../../services/api';
import { STORAGE_KEYS, API_URL } from '../../../utils/constants';

export default function DocumentsScreen() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const driver = useAppSelector((state) => state.auth.driver);
    const documents = useAppSelector((state) => state.documents.documents);
    const isLoading = useAppSelector((state) => state.documents.isLoading);
    const error = useAppSelector((state) => state.documents.error);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(fetchDocuments());
    }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchDocuments());
        setRefreshing(false);
    };

    const handleUpload = async (file: FormData, metadata: any) => {
        try {
            if (!user?.id) {
                throw new Error('Kullanıcı kimliği bulunamadı');
            }

            // Upload file first
            const uploadedFile = await api.uploadDocumentV2(file);

            // Extract display name from custom fileName (without extension)
            const displayName = metadata.fileName.replace(/\.[^/.]+$/, "");

            // Create document record
            await api.createDocumentRecord({
                entityType: 'DRIVER',
                entityId: driver?.id || user.id,
                type: metadata.documentType === 'LICENSE' ? 'DRIVERS_LICENSE' : 'OTHER',
                fileName: uploadedFile.filename,
                displayName: displayName,
                fileUrl: uploadedFile.fileUrl,
                fileSize: uploadedFile.fileSize,
                mimeType: uploadedFile.mimeType,
            });

            // Refresh list
            dispatch(fetchDocuments());
        } catch (error) {
            throw error;
        }
    };

    const handleViewDocument = async (document: any) => {
        console.log('📄 Viewing document:', document.displayName || document.fileName);
        console.log('🔗 File URL (original):', document.fileUrl);

        try {
            // Parse URL to extract path (handles IP changes)
            let fileUrl = document.fileUrl;
            try {
                const url = new URL(document.fileUrl);
                // Extract path (e.g., /file-upload/documents/filename.pdf)
                const path = url.pathname;

                // Reconstruct with current API base
                // API_URL = http://192.168.1.125:3000/api, remove /api suffix
                const baseUrl = API_URL.replace('/api', '');
                fileUrl = `${baseUrl}${path}`;

                console.log('🔄 Reconstructed URL:', fileUrl);
            } catch (urlError) {
                console.warn('⚠️ Could not parse URL, using as-is:', urlError);
            }

            // Test with fetch first
            console.log('🌐 Testing URL with fetch...');
            const fetchResponse = await fetch(fileUrl);
            console.log('📥 Fetch response status:', fetchResponse.status);
            console.log('📥 Fetch response ok:', fetchResponse.ok);

            if (!fetchResponse.ok) {
                Alert.alert('Hata', `URL'e erişilemiyor (${fetchResponse.status})`);
                return;
            }

            // Get blob
            const blob = await fetchResponse.blob();
            console.log('📦 Blob size:', blob.size, 'type:', blob.type);

            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(blob as any);

            await new Promise((resolve, reject) => {
                reader.onloadend = resolve;
                reader.onerror = reject;
            });

            const base64data = reader.result as string;
            console.log('✅ File downloaded, size:', base64data.length);

            // Save to FileSystem
            const fileName = `${document.displayName || 'belge'}.${document.mimeType.split('/')[1]}`;
            const fileUri = FileSystem.cacheDirectory + fileName;

            // Remove data URL prefix and write
            const base64 = base64data.split(',')[1];
            await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: FileSystem.EncodingType.Base64,
            });

            console.log('💾 File saved to:', fileUri);

            // Share/view document
            const canShare = await Sharing.isAvailableAsync();
            console.log('📤 Can share:', canShare);

            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    UTI: document.mimeType,
                    mimeType: document.mimeType,
                });
                console.log('✅ Share sheet opened');
            } else {
                Alert.alert('Hata', 'Belge paylaşma özelliği bu cihazda desteklenmiyor');
            }
        } catch (error: any) {
            console.error('❌ Document view error:', error);
            console.error('❌ Error message:', error?.message);
            console.error('❌ Error stack:', error?.stack);
            Alert.alert(
                'Hata',
                `Belge açılırken bir sorun oluştu${error?.message ? ': ' + error.message : ''}`
            );
        }
    };

    const handleDelete = (documentId: string) => {
        Alert.alert(
            'Belgeyi Sil',
            'Bu belgeyi silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => dispatch(deleteDocument(documentId)),
                },
            ]
        );
    };

    if (isLoading && documents.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Upload Button */}
            <View style={styles.uploadContainer}>
                <DocumentUploadButton
                    onUpload={handleUpload}
                    documentType="LICENSE"
                    label="📄 Belge Yükle"
                />
            </View>

            {/* Documents List */}
            {documents.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>📋 Henüz belgeniz yok</Text>
                    <Text style={styles.emptySubtext}>
                        Yukarıdaki butonu kullanarak belge yükleyebilirsiniz
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={documents}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <DocumentCard
                            document={item}
                            onPress={() => handleViewDocument(item)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.primary}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    uploadContainer: {
        padding: Spacing.lg,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray200,
    },
    listContent: {
        padding: Spacing.lg,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emptyText: {
        fontSize: Typography.lg,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    emptySubtext: {
        fontSize: Typography.base,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
    errorText: {
        fontSize: Typography.md,
        color: Colors.danger,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
});
