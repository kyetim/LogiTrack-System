'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const { data } = await api.get('/auth/me');

                // Route Guarding check
                if (!checkRouteAccess(data.role, window.location.pathname)) {
                    router.push('/dashboard'); // Redirect to safe default
                }

                setUser(data);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                if (window.location.pathname !== '/login') {
                    router.push('/login');
                }
            }
        }
        setIsLoading(false);
    };

    // Check if the role is allowed to access the given path
    const checkRouteAccess = (role: string, pathname: string) => {
        // ADMIN can access everything
        if (role === 'ADMIN') return true;

        // DISPATCHER restrictions
        if (role === 'DISPATCHER') {
            const restrictedPaths = ['/dashboard/users', '/dashboard/analytics'];
            return !restrictedPaths.some(path => pathname.startsWith(path));
        }

        // DRIVER should never be here
        if (role === 'DRIVER') return false;

        return true;
    };

    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });

        // RBAC: Block DRIVER login
        if (data.user.role === 'DRIVER') {
            throw new Error('Sürücüler yönetim paneline giriş yapamaz. Lütfen mobil uygulamayı kullanın.');
        }

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        setUser(data.user);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
