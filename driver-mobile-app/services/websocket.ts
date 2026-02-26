import { io, Socket } from 'socket.io-client';
import { API_URL, WS_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

class WebSocketService {
    private socket: Socket | null = null;      // /messaging namespace
    private supportSocket: Socket | null = null; // main namespace (for support events)
    private userId: string | null = null;

    /**
     * Connect to WebSocket server
     */
    async connect() {
        // Get user ID from storage
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (!userData) {
            console.error('No user data found for WebSocket connection');
            return;
        }

        const user = JSON.parse(userData);
        this.userId = user.id;

        if (!this.userId) {
            console.error('No userId available for WebSocket connection');
            return;
        }

        // Get auth token
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        // Connect to messaging namespace
        // IMPORTANT: userId must be in query so the Gateway can map the socket
        this.socket = io(`${WS_URL}/messaging`, {
            query: { userId: this.userId },
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        // Setup event listeners
        this.socket.on('connect', () => {
            console.log('WebSocket connected, userId:', this.userId);
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        this.socket.on('error', (error: any) => {
            console.error('WebSocket error:', error);
        });

        return this.socket;
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.disconnectSupportSocket();
    }

    /**
     * Connect to the MAIN WebSocket namespace to receive support events (admin replies etc.)
     */
    async connectSupportSocket() {
        if (this.supportSocket?.connected) return; // already connected

        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) return;

        this.supportSocket = io(WS_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.supportSocket.on('connect', () => {
            console.log('[WS] Support socket connected (main namespace)');
        });

        this.supportSocket.on('disconnect', () => {
            console.log('[WS] Support socket disconnected');
        });
    }

    /**
     * Disconnect support socket
     */
    disconnectSupportSocket() {
        if (this.supportSocket) {
            this.supportSocket.removeAllListeners();
            this.supportSocket.disconnect();
            this.supportSocket = null;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Send a message
     */
    sendMessage(recipientId: string, content: string) {
        if (!this.socket) {
            console.log('WebSocket not connected');
            return;
        }

        this.socket.emit('sendMessage', {
            recipientId,
            content,
        });
    }

    /**
     * Mark message as read
     */
    markAsRead(messageId: string) {
        if (!this.socket) {
            console.log('WebSocket not connected');
            return;
        }

        this.socket.emit('markAsRead', { messageId });
    }

    /**
     * Send typing indicator
     */
    typing(recipientId: string) {
        if (!this.socket) return;
        this.socket.emit('typing', { recipientId });
    }

    /**
     * Stop typing indicator
     */
    stopTyping(recipientId: string) {
        if (!this.socket) return;
        this.socket.emit('stopTyping', { recipientId });
    }

    /**
     * Listen for new messages
     */
    onNewMessage(callback: (message: any) => void) {
        if (!this.socket) return;
        this.socket.on('newMessage', callback);
    }

    /**
     * Listen for message read receipts
     */
    onMessageRead(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.on('messageRead', callback);
    }

    /**
     * Listen for typing indicators
     */
    onUserTyping(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.on('userTyping', callback);
    }

    /**
     * Listen for stop typing
     */
    onUserStoppedTyping(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.on('userStoppedTyping', callback);
    }

    /**
     * Listen for online status changes
     */
    onUserOnline(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.on('userOnline', callback);
    }

    onUserOffline(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.on('userOffline', callback);
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        if (this.socket) this.socket.removeAllListeners();
        if (this.supportSocket) this.supportSocket.removeAllListeners();
    }

    /**
     * Listen for admin replies on support tickets (main namespace)
     */
    onAdminReply(callback: (data: any) => void) {
        if (!this.supportSocket) return;
        this.supportSocket.on('support:admin-reply', callback);
    }

    offAdminReply(callback: (data: any) => void) {
        if (!this.supportSocket) return;
        this.supportSocket.off('support:admin-reply', callback);
    }

    /**
     * Remove a specific newMessage listener
     */
    offNewMessage(callback: (message: any) => void) {
        if (!this.socket) return;
        this.socket.off('newMessage', callback);
    }

    /**
     * Get socket instance (for advanced usage)
     */
    getSocket(): Socket | null {
        return this.socket;
    }
}

// Export singleton instance
export const websocketService = new WebSocketService();
