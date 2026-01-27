import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

class WebSocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    async connect() {
        try {
            // Get token from storage
            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (!token) {
                console.error('No auth token found');
                return false;
            }

            // Get base URL (remove /api suffix)
            const WS_URL = __DEV__
                ? 'http://192.168.1.126:4000'
                : 'https://your-production-url.com';

            // Connect to WebSocket
            this.socket = io(WS_URL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: this.reconnectDelay,
                reconnectionAttempts: this.maxReconnectAttempts,
            });

            // Setup event listeners
            this.setupEventListeners();

            return true;
        } catch (error) {
            console.error('WebSocket connection error:', error);
            return false;
        }
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.reconnectAttempts++;
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    sendLocation(coordinates: { latitude: number; longitude: number }, speed?: number, heading?: number) {
        if (!this.socket || !this.socket.connected) {
            console.warn('WebSocket not connected, cannot send location');
            return false;
        }

        this.socket.emit('location:send', {
            coordinates,
            speed,
            heading,
        });

        return true;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }
}

export default new WebSocketService();
