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

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

interface RegisterScreenProps {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    // Form State
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [licenseUploaded, setLicenseUploaded] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Errors State
    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        phone?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
        license?: string;
    }>({});

    const validateEmail = useCallback((val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), []);
    const validatePhone = useCallback((val: string) => val.length >= 10, []); // Basic check

    const handleRegister = useCallback(async () => {
        let newErrors: any = {};
        let isValid = true;

        if (!form.fullName.trim()) {
            newErrors.fullName = 'Ad Soyad zorunludur.';
            isValid = false;
        }

        if (!form.email || !validateEmail(form.email)) {
            newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
            isValid = false;
        }

        if (!form.phone || !validatePhone(form.phone)) {
            newErrors.phone = 'Geçerli bir telefon numarası giriniz.';
            isValid = false;
        }

        if (!form.password || form.password.length < 6) {
            newErrors.password = 'Şifre en az 6 karakter olmalıdır.';
            isValid = false;
        }

        if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor.';
            isValid = false;
        }

        if (!licenseUploaded) {
            newErrors.license = 'Sürücü belgesi yüklenmelidir.';
            isValid = false;
        }

        if (!termsAccepted) {
            newErrors.terms = 'Kullanım koşullarını kabul etmelisiniz.';
            isValid = false;
        }

        setErrors(newErrors);

        if (isValid) {
            setIsLoading(true);
            try {
                const nameParts = form.fullName.trim().split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '';

                await api.registerDriver({
                    email: form.email,
                    password: form.password,
                    phoneNumber: form.phone,
                    firstName,
                    lastName,
                });

                Alert.alert(
                    'Kayıt Başarılı',
                    'Hesabınız oluşturuldu. Yönetici onayından sonra giriş yapabilirsiniz.',
                    [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
                );
            } catch (error: any) {
                const message = error.response?.data?.message
                    ? Array.isArray(error.response.data.message)
                        ? error.response.data.message.join('\n')
                        : error.response.data.message
                    : 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.';
                Alert.alert('Hata', message);
            } finally {
                setIsLoading(false);
            }
        }
    }, [form.fullName, form.email, form.phone, form.password, form.confirmPassword, licenseUploaded, termsAccepted, validateEmail, validatePhone, navigation]);

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
                    <Text style={styles.subtitle}>
                        Aramıza katılmak için formu doldur.
                    </Text>

                    <View style={styles.spacer32} />

                    {/* Form Fields */}
                    <AppInput
                        label="Ad Soyad"
                        placeholder="Örn. Ahmet Yılmaz"
                        value={form.fullName}
                        onChangeText={(t) => {
                            setForm((prev) => ({ ...prev, fullName: t }));
                            setErrors({ ...errors, fullName: undefined });
                        }}
                        icon={<User color={Colors.gray} size={18} />}
                        error={errors.fullName}
                    />

                    <AppInput
                        label="E-Posta"
                        placeholder="E-posta adresinizi giriniz"
                        value={form.email}
                        onChangeText={(t) => {
                            setForm((prev) => ({ ...prev, email: t }));
                            setErrors({ ...errors, email: undefined });
                        }}
                        icon={<Mail color={Colors.gray} size={18} />}
                        keyboardType="email-address"
                        error={errors.email}
                    />

                    <AppInput
                        label="Telefon"
                        placeholder="+90 5XX XXX XX XX"
                        value={form.phone}
                        onChangeText={(t) => {
                            setForm((prev) => ({ ...prev, phone: t }));
                            setErrors({ ...errors, phone: undefined });
                        }}
                        icon={<Phone color={Colors.gray} size={18} />}
                        keyboardType="phone-pad"
                        error={errors.phone}
                    />

                    <AppInput
                        label="Şifre"
                        placeholder="Şifrenizi oluşturun"
                        value={form.password}
                        onChangeText={(t) => {
                            setForm((prev) => ({ ...prev, password: t }));
                            setErrors({ ...errors, password: undefined });
                        }}
                        icon={<Lock color={Colors.gray} size={18} />}
                        secureTextEntry
                        showToggle
                        error={errors.password}
                    />

                    <AppInput
                        label="Şifre Tekrar"
                        placeholder="Şifrenizi tekrar giriniz"
                        value={form.confirmPassword}
                        onChangeText={(t) => {
                            setForm((prev) => ({ ...prev, confirmPassword: t }));
                            setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        icon={<Lock color={Colors.gray} size={18} />}
                        secureTextEntry
                        showToggle
                        error={errors.confirmPassword}
                    />

                    {/* Sürücü Belgesi Upload Box */}
                    <Text style={styles.fieldLabel}>SÜRÜCÜ BELGESİ</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.uploadContainer}
                        onPress={() => {
                            setLicenseUploaded(!licenseUploaded);
                            setErrors({ ...errors, license: undefined });
                        }}
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
                    {errors.license && <Text style={styles.errorText}>{errors.license}</Text>}

                    <View style={styles.spacer24} />

                    {/* Checkbox (Terms of Service) */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        activeOpacity={0.8}
                        onPress={() => {
                            setTermsAccepted(!termsAccepted);
                            setErrors({ ...errors, terms: undefined });
                        }}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                termsAccepted && styles.checkboxActive,
                                errors.terms && !termsAccepted && { borderColor: Colors.error },
                            ]}
                        >
                            {termsAccepted && <Check color="#000" size={14} strokeWidth={3} />}
                        </View>
                        <Text style={styles.checkboxText}>
                            <Text style={styles.highlightText}>Kullanım Koşulları</Text> ve{' '}
                            <Text style={styles.highlightText}>Gizlilik Politikası</Text>'nı okudum ve kabul
                            ediyorum.
                        </Text>
                    </TouchableOpacity>
                    {errors.terms && <Text style={[styles.errorText, { marginLeft: 0 }]}>{errors.terms}</Text>}

                    <View style={styles.spacer24} />

                    {/* Submit Button */}
                    <AppButton
                        title="Kayıt Ol"
                        onPress={handleRegister}
                        variant="primary"
                        fullWidth
                        loading={isLoading}
                    />

                    <View style={styles.spacer24} />

                    {/* Login Link */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginBtn} activeOpacity={0.8}>
                        <Text style={styles.loginText}>
                            Zaten hesabın var mı? <Text style={styles.loginHighlight}>Giriş Yap</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
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
    titleHighlight: {
        color: Colors.primary,
    },
    subtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        marginTop: 8,
        marginBottom: 8,
    },
    // Document Upload Styles
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
        backgroundColor: Colors.surface, // #1A1A1A
        borderWidth: 1.5,
        borderColor: '#333333',
        borderStyle: 'dashed',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    uploadLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
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
        backgroundColor: 'rgba(76, 175, 80, 0.15)', // Success matching alpha
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
    // Checkbox Styles
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'transparent',
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
        marginTop: 2, // align with first line of text
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
    highlightText: {
        color: Colors.primary,
        fontFamily: Typography.fontBodyMedium,
    },
    errorText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.error,
        marginTop: 6,
        marginLeft: 4,
    },
    // Login Button Styles
    loginBtn: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    loginText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
    },
    loginHighlight: {
        fontFamily: Typography.fontBodySemiBold,
        color: Colors.primary,
    },
    spacer32: { height: 32 },
    spacer24: { height: 24 },
});
