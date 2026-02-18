'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'new_ticket' | 'new_message' | 'status_changed' | 'emergency' | 'legacy_message';
    ticketId?: string;
    conversationId?: string; // For legacy messages
    read: boolean;
    timestamp: Date;
}

interface SocketContextType {
    socket: Socket | null;
    messageSocket: Socket | null;
    isConnected: boolean;
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messageSocket, setMessageSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch initial state
    useEffect(() => {
        if (!user) return;

        const fetchInitialState = async () => {
            try {
                // Fetch unread legacy messages count
                const unreadMsgRes = await api.get('/messages/unread-count');
                const unreadMsgCount = unreadMsgRes.data.unreadCount || 0;

                if (unreadMsgCount > 0) {
                    addNotification({
                        id: 'initial-legacy-msgs',
                        title: 'Okunmamış Mesajlar',
                        message: `${unreadMsgCount} adet okunmamış mesajınız var.`,
                        type: 'legacy_message',
                        read: false,
                        timestamp: new Date(),
                    });
                }

                // Fetch waiting support tickets (optional - if backend supports filtering)
                // For now, we rely on live updates for tickets, or we could fetch filtered list
                // const ticketRes = await api.get('/support/tickets?status=WAITING_REPLY');
                // if (ticketRes.data.length > 0) { ... }

            } catch (error) {
                console.error('Failed to fetch initial notifications:', error);
            }
        };

        fetchInitialState();
    }, [user]);

    // Main Support Socket
    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
            auth: { token },
            transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
            console.log('Support Socket connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Support Socket disconnected');
            setIsConnected(false);
        });

        if (user.role === 'ADMIN' || user.role === 'DISPATCHER') {
            socketInstance.emit('dispatcher:join');

            socketInstance.on('support:new-ticket', (data: any) => {
                addNotification({
                    id: Date.now().toString(),
                    title: 'Yeni Destek Talebi',
                    message: `${data.ticketNumber} numaralı yeni talep oluşturuldu.`,
                    type: 'new_ticket',
                    ticketId: data.ticketId,
                    read: false,
                    timestamp: new Date(),
                });
                toast.info(`Yeni Destek Talebi: #${data.ticketNumber}`);
            });

            socketInstance.on('support:new-message', (data: any) => {
                addNotification({
                    id: Date.now().toString(),
                    title: 'Yeni Destek Mesajı',
                    message: `Ticket #${data.ticketId} için yeni mesaj var.`,
                    type: 'new_message',
                    ticketId: data.ticketId,
                    read: false,
                    timestamp: new Date(),
                });
                toast.info('Yeni destek mesajı alındı');
            });

            socketInstance.on('support:status-changed', (data: any) => {
                addNotification({
                    id: Date.now().toString(),
                    title: 'Durum Güncellendi',
                    message: `Ticket #${data.ticketId} durumu: ${data.status}`,
                    type: 'status_changed',
                    ticketId: data.ticketId,
                    read: false,
                    timestamp: new Date(),
                });
            });
        }

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    // Legacy Messaging Socket
    useEffect(() => {
        if (!user) {
            if (messageSocket) {
                messageSocket.disconnect();
                setMessageSocket(null);
            }
            return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        // Connect to /messaging namespace
        const msgSocketInstance = io(`${baseUrl}/messaging`, {
            query: { userId: user.id },
            transports: ['websocket'],
        });

        msgSocketInstance.on('connect', () => {
            console.log('Messaging Socket connected:', msgSocketInstance.id);
        });

        msgSocketInstance.on('disconnect', () => {
            console.log('Messaging Socket disconnected');
        });

        msgSocketInstance.on('newMessage', (message: any) => {
            addNotification({
                id: `msg-${message.id}`,
                title: 'Yeni Mesaj',
                message: `${message.sender?.firstName || 'Sürücü'} size bir mesaj gönderdi.`,
                type: 'legacy_message',
                conversationId: message.senderId,
                read: false,
                timestamp: new Date(),
            });
            toast.info('Yeni mesaj alındı');
        });

        setMessageSocket(msgSocketInstance);

        return () => {
            msgSocketInstance.disconnect();
        };
    }, [user]);

    const addNotification = (notification: Notification) => {
        setNotifications(prev => {
            // Avoid duplicates based on ID
            if (prev.some(n => n.id === notification.id)) return prev;
            return [notification, ...prev];
        });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <SocketContext.Provider value={{ socket, messageSocket, isConnected, notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};
