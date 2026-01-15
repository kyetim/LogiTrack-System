import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store, useAppSelector, useAppDispatch } from './store';
import { loadStoredAuth } from './store/slices/authSlice';
import LoginScreen from './app/(auth)/login';
import { COLORS } from './utils/constants';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.success,
    error: COLORS.danger,
  },
};

function AppContent() {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    // Test API connectivity
    const testAPI = async () => {
      try {
        console.log('Testing API connection to:', COLORS.primary);
        const response = await fetch('http://192.168.1.127:4000/api/health');
        console.log('API Health Check Status:', response.status);
        const data = await response.text();
        console.log('API Health Check Response:', data);
      } catch (error) {
        console.error('API Health Check Failed:', error);
      }
    };

    testAPI();

    // Try to load stored auth on app start
    dispatch(loadStoredAuth()).finally(() => {
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show login if not authenticated
  if (!user || !token) {
    return <LoginScreen />;
  }

  // TODO: Show main app navigation
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <AppContent />
        </PaperProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
