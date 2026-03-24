import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
    url?: string;
    autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const {
        url = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')) || 'http://localhost:3000',
        autoConnect = true,
    } = options;

    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!autoConnect) return;

        // Get token
        const token = localStorage.getItem('token');

        // Create socket connection
        socketRef.current = io(url, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            auth: {
                token,
            },
        });

        const socket = socketRef.current;

        // Connection event handlers
        socket.on('connect', () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
            setError(err.message);
            setIsConnected(false);
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [url, autoConnect]);

    const emit = (event: string, data?: any) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    };

    const on = (event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.on(event, handler);
    };

    const off = (event: string, handler?: (...args: any[]) => void) => {
        socketRef.current?.off(event, handler);
    };

    return {
        socket: socketRef.current,
        isConnected,
        error,
        emit,
        on,
        off,
    };
}
