import React, { useEffect } from 'react';
import { Redirect, useRouter, useRootNavigationState } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../store';
import { loadStoredAuth } from '../store/slices/authSlice';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

export default function Index() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, token } = useAppSelector((state) => state.auth);
    const [isInitializing, setIsInitializing] = React.useState(true);

    const navigationState = useRootNavigationState();

    useEffect(() => {
        // Try to load stored auth on app start
        dispatch(loadStoredAuth()).finally(() => {
            setIsInitializing(false);
        });
    }, []);

    // Listen for auth changes and redirect
    useEffect(() => {
        if (!navigationState?.key || isInitializing) return;

        const isAuthenticated = !!(token && user);

        if (isAuthenticated) {
            router.replace('/(main)');
        } else {
            router.replace('/(auth)');
        }
    }, [user, token, navigationState?.key, isInitializing]);

    // Show loading while initializing
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});
