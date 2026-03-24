import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { AppButton } from '@/components/ui/AppButton';
import { COLORS } from '../../../utils/constants'; // root utils/constants.ts

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Production'da burada crash reporting servisi çağrılır (örn: Sentry.captureException)
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    handleGoHome = () => {
        this.handleReset();
        try {
            router.replace('/(main)');
        } catch {
            // Router henüz mount olmamışsa sessizce geç
            // Kullanıcı handleReset sonrası zaten yeniden render alır
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <View style={styles.container}>
                    <AlertTriangle color="#FFD700" size={48} style={styles.icon} />

                    <Text style={styles.title}>Beklenmedik Bir Hata</Text>
                    <Text style={styles.description}>
                        Uygulama beklenmedik bir durumla karşılaştı.
                    </Text>

                    {/* Dev Mode Error Detail */}
                    {__DEV__ && this.state.error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {this.state.error.toString()}
                            </Text>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <AppButton
                            variant="outline"
                            title="Yeniden Dene"
                            onPress={this.handleReset}
                        />
                        <AppButton
                            variant="primary"
                            title="Ana Sayfaya Dön"
                            onPress={this.handleGoHome}
                        />
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D', // Dark Theme bg
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        fontFamily: 'Syne_800ExtraBold',
        fontSize: 20,
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#8A8A8A',
        textAlign: 'center',
        marginBottom: 32,
    },
    errorBox: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 1,
        borderColor: COLORS.danger,
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    errorText: {
        color: COLORS.danger,
        fontFamily: 'Outfit_400Regular',
        fontSize: 12,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    button: {
        width: '100%',
    },
});

export default ErrorBoundary;
