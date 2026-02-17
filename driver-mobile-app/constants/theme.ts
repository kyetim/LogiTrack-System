// Design tokens for easy theming later
export const Colors = {
    // Primary - Deep Navy
    primary: '#003366',
    primaryLight: '#335C85',
    primaryDark: '#002244',

    // Status
    success: '#10b981',
    warning: '#f59e0b', // Amber/Gold
    danger: '#ef4444',
    info: '#64748B',    // Slate Blue

    // Neutrals
    black: '#000000',
    white: '#FFFFFF',
    gray900: '#0F172A', // Slate-900
    gray800: '#1E293B',
    gray700: '#334155',
    gray600: '#475569',
    gray500: '#64748B',
    gray400: '#94A3B8',
    gray300: '#CBD5E1',
    gray200: '#E2E8F0',
    gray100: '#F1F5F9', // Slate-100

    // Background
    background: '#F8FAFC',
    surface: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.6)', // Darker slate overlay based on navy

    // Text
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const Typography = {
    // Font sizes
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 36,

    // Font weights
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
};
