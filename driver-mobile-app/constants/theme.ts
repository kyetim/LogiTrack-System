// Design tokens for easy theming later
export const Colors = {
    // Primary
    primary: '#007AFF',
    primaryLight: '#5AC8FA',
    primaryDark: '#0051D5',

    // Status
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#5AC8FA',

    // Neutrals
    black: '#000000',
    white: '#FFFFFF',
    gray900: '#1C1C1E',
    gray800: '#2C2C2E',
    gray700: '#3A3A3C',
    gray600: '#48484A',
    gray500: '#636366',
    gray400: '#8E8E93',
    gray300: '#C7C7CC',
    gray200: '#E5E5EA',
    gray100: '#F2F2F7',

    // Background
    background: '#FFFFFF',
    surface: '#F2F2F7',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Text
    textPrimary: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
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
