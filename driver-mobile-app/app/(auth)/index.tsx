import React, { useEffect } from 'react';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { useAppSelector } from '../../store';
import { useRouter } from 'expo-router';

export default function AuthLayout() {
    const router = useRouter();
    const { user, token } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (user && token) {
            console.log('🔀 Auth state changed → navigating to (main)');
            router.replace('/(main)');
        }
    }, [user, token]);

    return <AuthNavigator />;
}
