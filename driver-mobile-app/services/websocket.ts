import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../utils/constants';
import secureStorage from '../src/services/secureStorage';
import { STORAGE_KEYS } from '../utils/constants';

class WebSocketService {
    private socket: Socket | null = null;      // /messaging namespace
    private supportSocket: Socket | null = null; // main namespace (for support events)
    private userId: string | null = null;

    // Pending listeners — registered before socket is created, attached on connect
    private pendingListeners = new Map<string, Set<Function>>();

    private registerPending(event: string, callback: Function) {
        if (!this.pendingListeners.has(event)) {
            this.pendingListeners.set(event, new Set());
        }
        this.pendingListeners.get(event)!.add(callback);
    }

    private flushPendingListeners() {
        if (!this.socket) return;
        this.pendingListeners.forEach((callbacks, event) => {
            callbacks.forEach(cb => this.socket!.on(event, cb as any));
        });
        this.pendingListeners.clear();
    }

    /**
     * Connect to WebSocket server
     */
    async connect() {
        // Get user ID from storage
        const userData = await secureStorage.getItem(STORAGE_KEYS.USER_DATA);
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
        const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

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

        // Attach any listeners registered before socket was created
        this.flushPendingListeners();

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
     * Emit driver location update via WebSocket (main namespace / support socket)
     * Backend gateway'deki 'location:send' event'ini tetikler
     */
    emitLocation(
        coordinates: { latitude: number; longitude: number },
        speed?: number,
        heading?: number
    ): void {
        if (!this.supportSocket?.connected) {
            console.warn('[WS] Location socket not connected, skipping WS emit');
            return;
        }
        this.supportSocket.emit('location:send', {
            coordinates,
            speed,
            heading,
        });
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
     * Connect to the MAIN WebSocket namespace.
     * Used for: support ticket events + real-time location broadcasting
     */
    async connectSupportSocket() {
        if (this.supportSocket?.connected) return; // already connected

        const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
        if (!this.socket) { this.registerPending('newMessage', callback); return; }
        this.socket.on('newMessage', callback);
    }

    /**
     * Listen for message read receipts
     */
    onMessageRead(callback: (data: any) => void) {
        if (!this.socket) { this.registerPending('messageRead', callback); return; }
        this.socket.on('messageRead', callback);
    }

    /**
     * Listen for typing indicators
     */
    onUserTyping(callback: (data: any) => void) {
        if (!this.socket) { this.registerPending('userTyping', callback); return; }
        this.socket.on('userTyping', callback);
    }

    /**
     * Listen for stop typing
     */
    onUserStoppedTyping(callback: (data: any) => void) {
        if (!this.socket) { this.registerPending('userStoppedTyping', callback); return; }
        this.socket.on('userStoppedTyping', callback);
    }

    /**
     * Listen for online status changes
     */
    onUserOnline(callback: (data: any) => void) {
        if (!this.socket) { this.registerPending('userOnline', callback); return; }
        this.socket.on('userOnline', callback);
    }

    onUserOffline(callback: (data: any) => void) {
        if (!this.socket) { this.registerPending('userOffline', callback); return; }
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
     * Listen for ticket status changes (admin closed/resolved ticket etc.)
     */
    onTicketStatusChanged(callback: (data: any) => void) {
        if (!this.supportSocket) return;
        this.supportSocket.on('support:status-changed', callback);
    }

    offTicketStatusChanged(callback: (data: any) => void) {
        if (!this.supportSocket) return;
        this.supportSocket.off('support:status-changed', callback);
    }

    /**
     * Remove a specific newMessage listener
     */
    offNewMessage(callback: (message: any) => void) {
        this.pendingListeners.get('newMessage')?.delete(callback);
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
