import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Phone, Lock, UploadCloud, Check } from 'lucide-react-native';
import { Colors, Typography, Radius } from '@/theme/tokens';
import { HexLogo } from '@/components/ui/HexLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { api } from '../../../services/api';
import * as DocumentPicker from 'expo-document-picker';

import { registerSchema } from '../../../utils/validators';
import { useFormValidation } from '../../../src/hooks/useFormValidation';
import { parseApiError } from '../../../utils/apiError';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

interface RegisterScreenProps {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    // ── Form State ──────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        password: '',
        confirmPassword: '',
    });
    const [licenseUploaded, setLicenseUploaded] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ Zod tabanlı form validasyonu — tüm alanlar (checkbox + upload dahil) tek şemada
    const { errors, validate, clearError } = useFormValidation(registerSchema);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const updateField = useCallback(
        (field: keyof typeof form) => (value: string) => {
            setForm((prev) => ({ ...prev, [field]: value }));
            clearError(field as any);
        },
        [clearError]
    );

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleRegister = useCallback(async () => {
        // Zod şemasına checkbox/upload durumları da dahil
        const isValid = validate({
            ...form,
            licenseUploaded: licenseUploaded as any,
            termsAccepted: termsAccepted as any,
        });

        if (!isValid) return;

        setIsLoading(true);
        try {
            const nameParts = form.fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            await api.registerDriver({
                email: form.email,
                password: form.password,
                phoneNumber: form.phone,
                licenseNumber: form.licenseNumber,
                firstName,
                lastName,
            });

            Alert.alert(
                'Kayıt Başarılı',
                'Hesabınız oluşturuldu. Yönetici onayından sonra giriş yapabilirsiniz.',
                [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: unknown) {
            // ✅ Merkezi apiError parser
            const { message } = parseApiError(error);
            Alert.alert('Kayıt Başarısız', message);
        } finally {
            setIsLoading(false);
        }
    }, [form, licenseUploaded, termsAccepted, validate, navigation]);

    // ── Document Picker ─────────────────────────────────────────────────────
    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setLicenseUploaded(true);
                clearError('licenseUploaded' as any);
            } else if (__DEV__) {
                // Emülatör: dosya seçimi iptal edilse de başarılı say
                setLicenseUploaded(true);
                clearError('licenseUploaded' as any);
            }
        } catch {
            Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Row */}
                    <View style={styles.logoRow}>
                        <HexLogo size="sm" showGlow={false} />
                        <Text style={styles.logoText}>LogiTrack</Text>
                    </View>

                    {/* Titles */}
                    <Text style={styles.title}>
                        Hesap{'\n'}
                        <Text style={styles.titleHighlight}>Oluştur</Text>
                    </Text>
                    <Text style={styles.subtitle}>Aramıza katılmak için formu doldur.</Text>

                    <View style={styles.spacer32} />

                    {/* Form Fields */}
                    <AppInput
                        label="Ad Soyad"
                        placeholder="Örn. Ahmet Yılmaz"
                        value={form.fullName}
                        onChangeText={updateField('fullName')}
                        icon={<User color={Colors.gray} size={18} />}
                        error={errors.fullName}
                    />

                    <AppInput
                        label="E-Posta"
                        placeholder="E-posta adresinizi giriniz"
                        value={form.email}
                        onChangeText={updateField('email')}
                        icon={<Mail color={Colors.gray} size={18} />}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <AppInput
                        label="Telefon"
                        placeholder="+90 5XX XXX XX XX"
                        value={form.phone}
                        onChangeText={updateField('phone')}
                        icon={<Phone color={Colors.gray} size={18} />}
                        keyboardType="phone-pad"
                        error={errors.phone}
                    />

                    <AppInput
                        label="Ehliyet Numarası"
                        placeholder="Örn. 12345678"
                        value={form.licenseNumber}
                        onChangeText={updateField('licenseNumber')}
                        icon={<User color={Colors.gray} size={18} />}
                        error={errors.licenseNumber}
                    />

                    <AppInput
                        label="Şifre"
                        placeholder="Şifrenizi oluşturun"
                        value={form.password}
                        onChangeText={updateField('password')}
                        icon={<Lock color={Colors.gray} size={18} />}
                        secureTextEntry
                        showToggle
                        error={errors.password}
                    />

                    <AppInput
                        label="Şifre Tekrar"
                        placeholder="Şifrenizi tekrar giriniz"
                        value={form.confirmPassword}
                        onChangeText={updateField('confirmPassword')}
                        icon={<Lock color={Colors.gray} size={18} />}
                        secureTextEntry
                        showToggle
                        error={errors.confirmPassword}
                    />

                    {/* Sürücü Belgesi Upload */}
                    <Text style={styles.fieldLabel}>SÜRÜCÜ BELGESİ</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            styles.uploadContainer,
                            (errors as any).licenseUploaded && { borderColor: Colors.error },
                        ]}
                        onPress={handlePickDocument}
                    >
                        <View style={styles.uploadLeft}>
                            <UploadCloud color={Colors.gray} size={20} />
                            <Text style={styles.uploadText}>Sürücü Belgesi Ön/Arka Yüz</Text>
                        </View>

                        {licenseUploaded ? (
                            <View style={styles.uploadChipSuccess}>
                                <Check color={Colors.success} size={12} strokeWidth={3} />
                                <Text style={styles.uploadChipTextSuccess}>Yüklendi</Text>
                            </View>
                        ) : (
                            <View style={styles.uploadChipPending}>
                                <Text style={styles.uploadChipTextPending}>Yükle</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {(errors as any).licenseUploaded && (
                        <Text style={styles.errorText}>{(errors as any).licenseUploaded}</Text>
                    )}

                    <View style={styles.spacer24} />

                    {/* Terms Checkbox */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        activeOpacity={0.8}
                        onPress={() => {
                            setTermsAccepted((prev) => !prev);
                            clearError('termsAccepted' as any);
                        }}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                termsAccepted && styles.checkboxActive,
                                (errors as any).termsAccepted && !termsAccepted && {
                                    borderColor: Colors.error,
                                },
                            ]}
                        >
                            {termsAccepted && <Check color="#000" size={14} strokeWidth={3} />}
                        </View>
                        <Text style={styles.checkboxText}>
                            <Text style={styles.highlightText}>Kullanım Koşulları</Text> ve{' '}
                            <Text style={styles.highlightText}>Gizlilik Politikası</Text>'nı okudum
                            ve kabul ediyorum.
                        </Text>
                    </TouchableOpacity>
                    {(errors as any).termsAccepted && (
                        <Text style={[styles.errorText, { marginLeft: 0 }]}>
                            {(errors as any).termsAccepted}
                        </Text>
                    )}

                    <View style={styles.spacer24} />

                    <AppButton
                        title="Kayıt Ol"
                        onPress={handleRegister}
                        variant="primary"
                        fullWidth
                        loading={isLoading}
                    />

                    <View style={styles.spacer24} />

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.loginBtn}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginText}>
                            Zaten hesabın var mı?{' '}
                            <Text style={styles.loginHighlight}>Giriş Yap</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
    logoRow: { flexDirection: 'row', alignItems: 'center' },
    logoText: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 20,
        color: Colors.white,
        marginLeft: 12,
    },
    title: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 26,
        color: Colors.white,
        lineHeight: 34,
        marginTop: 40,
    },
    titleHighlight: { color: Colors.primary },
    subtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        marginTop: 8,
        marginBottom: 8,
    },
    fieldLabel: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    uploadContainer: {
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: '#333333',
        borderStyle: 'dashed',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    uploadLeft: { flexDirection: 'row', alignItems: 'center' },
    uploadText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        marginLeft: 12,
    },
    uploadChipPending: {
        backgroundColor: Colors.primaryDim,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.full,
    },
    uploadChipTextPending: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.primary,
    },
    uploadChipSuccess: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    uploadChipTextSuccess: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.success,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingRight: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#333333',
        backgroundColor: Colors.surface,
        marginRight: 12,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkboxText: {
        flex: 1,
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 20,
    },
    highlightText: { color: Colors.primary, fontFamily: Typography.fontBodyMedium },
    errorText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.error,
        marginTop: 6,
        marginLeft: 4,
    },
    loginBtn: { paddingVertical: 8, alignItems: 'center' },
    loginText: { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.gray },
    loginHighlight: { fontFamily: Typography.fontBodySemiBold, color: Colors.primary },
    spacer32: { height: 32 },
    spacer24: { height: 24 },
});
