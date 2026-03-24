import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Fingerprint } from 'lucide-react-native';
import { Colors, Typography } from '@/theme/tokens';
import { HexLogo } from '@/components/ui/HexLogo';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';

import { useAppDispatch } from '../../../store';
import { login } from '../../../store/slices/authSlice';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

// Define expected Navigation prop types for TS
interface LoginScreenProps {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Error States
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Basic email validation regex
    const validateEmail = useCallback((val: string) => {
        return val.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }, []);

    const handleLogin = useCallback(() => {
        let isValid = true;
        setEmailError('');
        setPasswordError('');

        if (!email || !validateEmail(email)) {
            setEmailError('Lütfen geçerli bir e-posta adresi girin.');
            isValid = false;
        }

        if (!password || password.length < 6) {
            setPasswordError('Şifreniz en az 6 karakter olmalıdır.');
            isValid = false;
        }

        if (isValid) {
            console.log('🔘 Giriş Yap butonuna basıldı. Dispatching actions...');
            setIsLoading(true);
            dispatch(login({ email, password }))
                .unwrap()
                .then(() => {
                    console.log('✅ LoginScreen: Dispatch başarılı, yönlendiriliyor...');
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.log('❌ LoginScreen: Dispatch hata fırlattı:', err);
                    setPasswordError(typeof err === 'string' ? err : 'Giriş yapılamadı.');
                    setIsLoading(false);
                });
        }
    }, [email, password, validateEmail, dispatch]);


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
                        Tekrar{'\n'}
                        <Text style={styles.titleHighlight}>Hoşgeldin</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Devam etmek için giriş bilgilerinizi giriniz.
                    </Text>

                    <View style={styles.spacer32} />

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <AppInput
                            label="E-Posta"
                            placeholder="E-posta adresinizi giriniz"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) setEmailError('');
                            }}
                            icon={<Mail color={Colors.gray} size={18} />}
                            keyboardType="email-address"
                            error={emailError}
                        />

                        <AppInput
                            label="Şifre"
                            placeholder="Şifrenizi giriniz"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (passwordError) setPasswordError('');
                            }}
                            icon={<Lock color={Colors.gray} size={18} />}
                            secureTextEntry={true}
                            showToggle={true}
                            error={passwordError}
                        />

                        <View style={styles.spacer8} />

                        <AppButton
                            title="Giriş Yap"
                            onPress={handleLogin}
                            variant="primary"
                            fullWidth={true}
                            loading={isLoading}
                        />
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>veya</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Biometric Button */}
                    <View style={styles.biometricContainer}>
                        <TouchableOpacity style={styles.biometricBtn} activeOpacity={0.8}>
                            <Fingerprint color={Colors.primary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.spacer24} />

                    {/* Bottom Links */}
                    <View style={styles.bottomLinksContainer}>
                        <TouchableOpacity onPress={() => { }} style={styles.forgotPassBtn} activeOpacity={0.8}>
                            <Text style={styles.forgotPassText}>Şifremi Unuttum</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={styles.registerBtn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.registerText}>
                                Hesabın yok mu? <Text style={styles.registerHighlight}>Kayıt Ol</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // #0D0D0D
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
        fontFamily: Typography.fontDisplayBold, // Syne_800ExtraBold
        fontSize: 26,
        color: Colors.white,
        lineHeight: 34,
        marginTop: 40,
    },
    titleHighlight: {
        color: Colors.primary, // #FFD700
    },
    subtitle: {
        fontFamily: Typography.fontBody, // Outfit_400Regular
        fontSize: 13,
        color: Colors.gray, // #8A8A8A
        marginTop: 8,
    },
    formContainer: {
        marginBottom: 32,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border, // #2A2A2A
    },
    dividerText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        paddingHorizontal: 16,
        textTransform: 'uppercase',
    },
    biometricContainer: {
        alignItems: 'center',
    },
    biometricBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.surface, // #1A1A1A
        borderWidth: 1.5,
        borderColor: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomLinksContainer: {
        alignItems: 'center',
        marginTop: 'auto', // Pushes this down if space allows
        minHeight: 100, // ensure space
        justifyContent: 'center',
    },
    forgotPassBtn: {
        marginBottom: 24,
    },
    forgotPassText: {
        fontFamily: Typography.fontBodyMedium, // Outfit_500Medium
        fontSize: 14,
        color: Colors.primary, // #FFD700
    },
    registerBtn: {
        paddingVertical: 8,
    },
    registerText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
    },
    registerHighlight: {
        fontFamily: Typography.fontBodySemiBold,
        color: Colors.primary,
    },
    spacer32: { height: 32 },
    spacer24: { height: 24 },
    spacer8: { height: 8 },
});
