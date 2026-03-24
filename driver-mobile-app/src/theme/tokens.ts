export const Colors = {
    background: '#0D0D0D',
    surface: '#1A1A1A',
    card: '#242424',
    card2: '#2A2A2A',
    primary: '#FFD700',
    primaryDim: 'rgba(255, 215, 0, 0.12)',
    primaryMid: 'rgba(255, 215, 0, 0.25)',
    white: '#FFFFFF',
    gray: '#8A8A8A',
    grayDim: '#3A3A3A',
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FF9800',
    border: '#2A2A2A',
    borderFocus: '#FFD700',
} as const;

export const Typography = {
    fontDisplay: 'Syne_700Bold',
    fontDisplayBold: 'Syne_800ExtraBold',
    fontBody: 'Outfit_400Regular',
    fontBodyMedium: 'Outfit_500Medium',
    fontBodySemiBold: 'Outfit_600SemiBold',
} as const;

export const FontSizes = {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
} as const;

export const Spacing = {
    1: 8,
    2: 16,
    3: 24,
    4: 32,
    5: 40,
    6: 48,
    8: 64,
} as const;

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 50,
    full: 9999,
} as const;

export const Shadows = {
    primaryGlow: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
} as const;
