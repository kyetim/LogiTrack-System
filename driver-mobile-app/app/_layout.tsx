import { Slot } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from '../store';
import { COLORS } from '../utils/constants';

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: COLORS.primary,
        secondary: COLORS.success,
        error: COLORS.danger,
    },
};

export default function RootLayout() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <PaperProvider theme={theme}>
                    <StatusBar style="auto" />
                    <Slot />
                </PaperProvider>
            </SafeAreaProvider>
        </Provider>
    );
}
