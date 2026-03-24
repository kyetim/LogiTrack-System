import { ENV } from '@/config/env';

// API Base URL - Update for production
// IMPORTANT: This is now automatically updated by update-ip.js script before expo starts
export const API_URL = ENV.API_URL;
export const WS_URL = ENV.WS_URL;
export const MQTT_URL = ENV.MQTT_URL;

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
    PENDING_ACTIONS_QUEUE: '@logitrack:pending_actions_queue',
} as const;

// App Config
export const APP_CONFIG = {
    name: 'LogiTrack Driver',
    version: '1.0.0',
    supportEmail: 'support@logitrack.com',
} as const;

// Colors (matching admin dashboard - Corporate Blue)
export const COLORS = {
    primary: '#003366', // Deep Navy
    success: '#10b981', // Standard Green
    warning: '#f59e0b', // Amber
    danger: '#ef4444',  // Red
    info: '#64748B',    // Slate Blue (Secondary)
    background: '#F8FAFC', // Slate-50
    text: '#0F172A',    // Slate-900
    textLight: '#64748B', // Slate-500
    border: '#E2E8F0',  // Slate-200
} as const;
