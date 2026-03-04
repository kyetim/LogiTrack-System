import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, FileText, Download, Share2, UploadCloud, Plus, AlertCircle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
// or * as ImagePicker from 'expo-image-picker' depending on needs

import { Colors, Typography } from '@/theme/tokens';
import { AppButton } from '@/components/ui/AppButton';

// Mock Interfaces and Data as per Prompt 1.1

interface Document {
    id: string;
    name: string;
    type: 'license' | 'contract' | 'insurance' | 'other';
    status: 'approved' | 'pending' | 'expired' | 'missing';
    uploadDate: string | null;
    expiryDate: string | null;
    fileSize: string | null;
    uri: string | null;
}

const mockDocuments: Document[] = [
    {
        id: 'doc_01',
        name: 'Sürücü Belgesi',
        type: 'license',
        status: 'approved',
        uploadDate: '12 Eki 2023',
        expiryDate: '12 Eki 2029',
        fileSize: '2.4 MB',
        uri: 'some_mock_uri_1',
    },
    {
        id: 'doc_02',
        name: 'Sürücü Sözleşmesi',
        type: 'contract',
        status: 'approved',
        uploadDate: '15 Kas 2023',
        expiryDate: null,
        fileSize: '1.1 MB',
        uri: 'some_mock_uri_2',
    },
    {
        id: 'doc_03',
        name: 'Araç Sigortası',
        type: 'insurance',
        status: 'pending',
        uploadDate: '28 Şub 2024',
        expiryDate: '28 Şub 2025',
        fileSize: '4.8 MB',
        uri: 'some_mock_uri_3',
    },
    {
        id: 'doc_04',
        name: 'Taşıma Ruhsatı',
        type: 'other',
        status: 'missing',
        uploadDate: null,
        expiryDate: null,
        fileSize: null,
        uri: null,
    },
];

export const DocumentsScreen = () => {
    const navigation = useNavigation();

    // Redux would normally be here to consume documentsSlice
    // Using mock data for initial UI build
    const [documents, setDocuments] = useState<Document[]>(mockDocuments);

    // Summary counts
    const approvedCount = documents.filter(d => d.status === 'approved').length;
    const pendingCount = documents.filter(d => d.status === 'pending').length;
    const missingCount = documents.filter(d => d.status === 'missing' || d.status === 'expired').length;

    // Helper functions
    const getStatusColor = (status: Document['status']) => {
        switch (status) {
            case 'approved': return '#4CAF50';
            case 'pending': return '#FF9800';
            case 'missing':
            case 'expired': return '#FF5252';
            default: return Colors.gray;
        }
    };

    const getStatusText = (status: Document['status']) => {
        switch (status) {
            case 'approved': return 'Onaylı';
            case 'pending': return 'Beklemede';
            case 'missing': return 'Eksik';
            case 'expired': return 'Süresi Dolmuş';
            default: return 'Bilinmiyor';
        }
    };

    const handleUploadAction = async (docId?: string) => {
        // Here we'll ask user which type to upload via Alert if docId is not provided
        if (!docId) {
            Alert.alert('Yeni Belge', 'Hangi belge türünü yüklemek istiyorsunuz?', [
                { text: 'Sürücü Belgesi', onPress: () => pickDocument('LICENSE') },
                { text: 'Sözleşme', onPress: () => pickDocument('CONTRACT') },
                { text: 'Diğer', onPress: () => pickDocument('OTHER') },
                { text: 'İptal', style: 'cancel' }
            ]);
        } else {
            // Re-upload specific missing Document
            pickDocument('SPECIFIC', docId);
        }
    };

    const pickDocument = async (type: string, targetId?: string) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;

            Alert.alert('Başarılı', `Belge seçildi: ${result.assets[0].name}`);
            // Here dispatch(uploadDocument({...})) would be triggered
        } catch (error) {
            Alert.alert('Hata', 'Belge seçilirken hata oluştu.');
        }
    };

    const handleDownload = async (doc: Document) => {
        // Dummy logic mimicking the legacy file system logic implementation
        Alert.alert('İndiriliyor', `${doc.name} cihazınıza indiriliyor...`);
    };

    const handleShare = async (doc: Document) => {
        // Dummy logic mimicking the legacy sharing implementation
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            Alert.alert('Paylaş', `${doc.name} paylaşım paneli açılıyor...`);
        } else {
            Alert.alert('Hata', 'Cihazınızda paylaşım desteklenmiyor.');
        }
    };

    const renderDocumentCard = ({ item }: { item: Document }) => {
        const isWarning = item.status === 'missing' || item.status === 'expired';

        return (
            <View style={[styles.documentCard, isWarning && styles.documentCardWarning]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <FileText color={Colors.white} size={24} />
                        <Text style={styles.cardTitle}>{item.name}</Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusText(item.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardMiddle}>
                    {item.uploadDate && (
                        <Text style={styles.infoText}>Yükleme: {item.uploadDate}</Text>
                    )}
                    {item.expiryDate && (
                        <Text style={[styles.infoText, isWarning && { color: Colors.error }]}>
                            Bitiş: {item.expiryDate} {isWarning && <AlertCircle color={Colors.error} size={12} />}
                        </Text>
                    )}
                    {item.fileSize && (
                        <Text style={styles.infoText}>Boyut: {item.fileSize}</Text>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    {item.status === 'missing' || item.status === 'expired' ? (
                        <AppButton
                            title="Yükle"
                            variant="primary"
                            size="sm"
                            fullWidth
                            // leftIcon={<UploadCloud color={Colors.background} size={18} />}
                            onPress={() => handleUploadAction(item.id)}
                        />
                    ) : (
                        <View style={styles.actionButtonsRow}>
                            <View style={styles.flexHalf}>
                                <AppButton
                                    title="İndir"
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    // leftIcon={<Download color={Colors.primary} size={18} />}
                                    onPress={() => handleDownload(item)}
                                />
                            </View>
                            <View style={styles.flexHalf}>
                                <AppButton
                                    title="Paylaş"
                                    variant="ghost"
                                    size="sm"
                                    fullWidth
                                    // leftIcon={<Share2 color={Colors.primary} size={18} />}
                                    onPress={() => handleShare(item)}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Belgelerim</Text>
                <View style={{ width: 40 }} /> {/* Header spacer */}
            </View>

            <View style={styles.summaryContainer}>
                <View style={[styles.summaryChip, { borderColor: '#4CAF5040', backgroundColor: '#4CAF5015' }]}>
                    <Text style={[styles.summaryCount, { color: '#4CAF50' }]}>{approvedCount}</Text>
                    <Text style={styles.summaryLabel}>Onaylı</Text>
                </View>
                <View style={[styles.summaryChip, { borderColor: '#FF980040', backgroundColor: '#FF980015' }]}>
                    <Text style={[styles.summaryCount, { color: '#FF9800' }]}>{pendingCount}</Text>
                    <Text style={styles.summaryLabel}>Beklemede</Text>
                </View>
                <View style={[styles.summaryChip, { borderColor: '#FF525240', backgroundColor: '#FF525215' }]}>
                    <Text style={[styles.summaryCount, { color: '#FF5252' }]}>{missingCount}</Text>
                    <Text style={styles.summaryLabel}>Eksik</Text>
                </View>
            </View>

            <FlatList
                data={documents}
                keyExtractor={item => item.id}
                renderItem={renderDocumentCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    <TouchableOpacity
                        style={styles.newDocumentBox}
                        activeOpacity={0.8}
                        onPress={() => handleUploadAction()}
                    >
                        <View style={styles.newDocumentIcon}>
                            <Plus color={Colors.primary} size={24} />
                        </View>
                        <Text style={styles.newDocumentText}>Yeni Belge Ekle</Text>
                    </TouchableOpacity>
                }
            />
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
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 20,
        color: Colors.white,
    },
    summaryContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    summaryChip: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    summaryCount: {
        fontFamily: Typography.fontDisplay,
        fontSize: 24,
        fontWeight: '700',
    },
    summaryLabel: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
        marginTop: 4,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    documentCard: {
        backgroundColor: '#1A1A1A', // From prompt requirement
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    documentCardWarning: {
        borderColor: '#FF525240',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    cardTitle: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 16,
        color: Colors.white,
        flex: 1,
    },
    statusChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        marginLeft: 8,
    },
    statusText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
    },
    cardMiddle: {
        backgroundColor: '#242424',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 4,
    },
    infoText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: '#8A8A8A',
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardFooter: {
        marginTop: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    flexHalf: {
        flex: 1,
    },
    newDocumentBox: {
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    newDocumentIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,215,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    newDocumentText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.primary,
    },
});
