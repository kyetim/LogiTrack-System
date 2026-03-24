'use client';

import { useState, useEffect } from 'react';
import tr from '@/messages/tr.json';
import en from '@/messages/en.json';

const messages = { tr, en };

export function useTranslations() {
    const [locale, setLocale] = useState<'tr' | 'en'>('tr');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('locale') as 'tr' | 'en';
        if (saved && (saved === 'tr' || saved === 'en')) {
            setLocale(saved);
        }
    }, []);

    return (key: string) => {
        // Return key during SSR to avoid hydration mismatch
        if (!mounted) {
            return key;
        }

        const keys = key.split('.');
        let value: any = messages[locale];

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
    };
}
