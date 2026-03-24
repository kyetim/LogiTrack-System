'use client';

import { useLocale } from '@/contexts/LocaleContext';

export function LanguageSwitcher() {
    const { locale, setLocale } = useLocale();

    const toggleLanguage = () => {
        setLocale(locale === 'tr' ? 'en' : 'tr');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="relative inline-flex h-9 w-16 items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Toggle language"
        >
            {/* Sliding toggle background */}
            <span
                className={`absolute inset-y-1 w-7 transform rounded-full bg-white shadow-md transition-transform duration-300 ${locale === 'tr' ? 'left-1' : 'right-1'
                    }`}
            />

            {/* Active language label - opposite side of toggle */}
            <span
                className={`absolute text-sm font-bold text-white transition-all duration-300 ${locale === 'tr' ? 'right-3' : 'left-3'
                    }`}
            >
                {locale === 'tr' ? 'TR' : 'EN'}
            </span>
        </button>
    );
}
