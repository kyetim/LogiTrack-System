// API Base URL - Update for production
// IMPORTANT: If login fails, check your network IP with 'ipconfig' and update below
export const API_URL = 'http://192.168.1.125:4000/api';
export const WS_URL = 'http://192.168.1.125:4000';

// GPS Tracking
export const GPS_UPDATE_INTERVAL = 30000; // 30 seconds
export const GPS_ACCURACY = 'high'; // 'low' | 'balanced' | 'high' | 'best'

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: '@logitrack:auth_token',
    USER_DATA: '@logitrack:user_data',
    DRIVER: '@logitrack:driver',
    OFFLINE_QUEUE: '@logitrack:offline_queue',
    CACHED_SHIPMENTS: '@logitrack:cached_shipments',
} as const;

// App Config
export const APP_CONFIG = {
    name: 'LogiTrack Driver',
    version: '1.0.0',
    supportEmail: 'support@logitrack.com',
} as const;

// Colors (matching admin dashboard)
export const COLORS = {
    primary: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    background: '#f9fafb',
    text: '#111827',
    textLight: '#6b7280',
    border: '#e5e7eb',
} as const;
