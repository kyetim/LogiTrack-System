import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActionSheetIOS, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X } from 'lucide-react-native';
import { Colors, Typography } from '@/theme/tokens';

export interface PhotoCaptureProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    maxPhotos?: number;
}

export const PhotoCapture = memo<PhotoCaptureProps>(({
    photos,
    onPhotosChange,
    maxPhotos = 3,
}) => {

    const handleRemovePhoto = (indexToRemove: number) => {
        const newPhotos = photos.filter((_, index) => index !== indexToRemove);
        onPhotosChange(newPhotos);
    };

    const handleAddPhoto = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['İptal', 'Kamera', 'Galeriden Seç'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        launchCamera();
                    } else if (buttonIndex === 2) {
                        launchGallery();
                    }
                }
            );
        } else {
            Alert.alert(
                'Fotoğraf Ekle',
                'Lütfen bir seçenek belirleyin',
                [
                    { text: 'Kamera', onPress: launchCamera },
                    { text: 'Galeriden Seç', onPress: launchGallery },
                    { text: 'İptal', style: 'cancel' }
                ]
            );
        }
    };

    const launchCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Kamera erişimi için ayarlardan izin vermeniz gerekiyor.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            base64: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            onPhotosChange([...photos, result.assets[0].uri]);
        }
    };

    const launchGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Galeri erişimi için ayarlardan izin vermeniz gerekiyor.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            base64: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            onPhotosChange([...photos, result.assets[0].uri]);
        }
    };

    const isMaxReached = photos.length >= maxPhotos;

    return (
        <View style={styles.container}>
            {/* Grid Area */}
            <View style={styles.gridContainer}>
                {photos.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={styles.photoWrapper}>
                        <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.removeBtn}
                            onPress={() => handleRemovePhoto(index)}
                        >
                            <X color={Colors.white} size={12} strokeWidth={3} />
                        </TouchableOpacity>
                    </View>
                ))}

                {!isMaxReached && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.addButton}
                        onPress={handleAddPhoto}
                    >
                        <Plus color={Colors.primary} size={24} />
                        <Text style={styles.addText}>Ekle</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Counter / Label */}
            <View style={styles.counterRow}>
                {isMaxReached ? (
                    <Text style={styles.maxReachedText}>✓ Maksimum fotoğraf eklendi</Text>
                ) : (
                    <Text style={styles.counterText}>{photos.length}/{maxPhotos} fotoğraf</Text>
                )}
            </View>
        </View>
    );
});

PhotoCapture.displayName = 'PhotoCapture';

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    photoWrapper: {
        position: 'relative',
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.background,
    },
    addButton: {
        width: 80,
        height: 80,
        backgroundColor: '#1A1A1A',
        borderWidth: 1.5,
        borderColor: '#3A3A3A',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.gray,
        marginTop: 4,
    },
    counterRow: {
        marginTop: 12,
    },
    counterText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    },
    maxReachedText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.primary,
    },
});
