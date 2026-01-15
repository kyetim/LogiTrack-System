import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
} from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';
import { COLORS } from '../../utils/constants';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (error) {
            Alert.alert('Giriş Hatası', error, [
                { text: 'Tamam', onPress: () => dispatch(clearError()) },
            ]);
        }
    }, [error]);

    const handleLogin = async () => {
        console.log('=== LOGIN BUTTON CLICKED ===');
        console.log('Email:', email);
        console.log('Password:', password);

        if (!email || !password) {
            console.log('Validation failed: empty fields');
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
            return;
        }

        console.log('Dispatching login action...');
        dispatch(login({ email, password }));
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>🚚</Text>
                    <Text style={styles.title}>LogiTrack</Text>
                    <Text style={styles.subtitle}>Sürücü Uygulaması</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <TextInput
                        label="E-posta"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        disabled={isLoading}
                        style={styles.input}
                    />

                    <TextInput
                        label="Şifre"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        disabled={isLoading}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        Giriş Yap
                    </Button>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    LogiTrack v1.0.0
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: 'white',
    },
    button: {
        marginTop: 8,
        backgroundColor: COLORS.primary,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    footer: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 32,
        fontSize: 12,
    },
});
