'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Plus, Circle, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";

interface User {
    id: string;
    email: string;
    role: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    recipientId: string;
    createdAt: string;
    isRead: boolean;
    attachments?: any;
}

interface Conversation {
    user: User;
    lastMessage: Message;
    unreadCount: number;
}

export default function MessagesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // New Chat State
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Initial Data Fetch
    useEffect(() => {
        if (user) {
            fetchConversations();
            connectSocket();
        }
        return () => {
            if (socket) socket.disconnect();
        };
    }, [user]);

    // Socket Connection
    const connectSocket = () => {
        const socketUrl = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000') + '/messaging';
        const newSocket = io(socketUrl, {
            query: { userId: user?.id },
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('newMessage', (message: Message) => {
            handleNewMessage(message);
        });

        newSocket.on('messageRead', (data: { messageId: string; readAt: string }) => {
            handleMessageRead(data.messageId);
        });

        setSocket(newSocket);
    };

    const handleNewMessage = (message: Message) => {
        // If message belongs to active conversation, add it
        if (activeConversation && (message.senderId === activeConversation.user.id || message.recipientId === activeConversation.user.id)) {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();

            // If checking our own sent message to this user, good.
            // If received from this user, mark as read immediately?
            if (message.senderId === activeConversation.user.id) {
                markAsRead(message.id);
            }
        } else {
            // Otherwise show toast or update counters
            if (message.recipientId === user?.id) {
                toast.info(`Yeni mesaj: ${message.content.substring(0, 20)}...`);
            }
        }
        // Always refresh conversations to update last message/order
        fetchConversations();
    };

    const handleMessageRead = (messageId: string) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
    };

    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/messages/conversations');
            setConversations(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    const fetchMessages = async (otherUserId: string) => {
        try {
            const { data } = await api.get(`/messages/conversation/${otherUserId}`);
            setMessages(data);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSelectConversation = (conv: Conversation) => {
        setActiveConversation(conv);
        fetchMessages(conv.user.id);
        // Mark conversation as read
        // Already handled by getConversation API on backend usually, but let's be sure
        // Backend getConversation marks read automatically (based on previous analysis)
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !user) return;

        try {
            // Optimistic update done by Socket (we receive our own message if we emit? No, API returns it)
            // But we used API to send.

            const { data } = await api.post('/messages', {
                recipientId: activeConversation.user.id,
                content: newMessage,
            });

            // Add to list immediately
            setMessages((prev) => [...prev, data]);
            setNewMessage('');
            scrollToBottom();

            // Update conversation list order
            fetchConversations();
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const markAsRead = async (messageId: string) => {
        try {
            await api.patch(`/messages/${messageId}/read`);
        } catch (error) {
            // ignore
        }
    };

    // New Chat Logic
    const handleOpenNewChat = async () => {
        setNewChatOpen(true);
        try {
            // Fetch all users/drivers
            // Ideally a dedicated endpoint for 'potential chat partners'
            const { data } = await api.get('/drivers');
            // Extract users from drivers
            const users = data.map((d: any) => ({
                id: d.user.id ? d.user.id : d.userId, // Driver object has user relation?
                // Depending on backend response structure for /drivers
                // Analysis of DriversPage showed d.user.email. 
                // So d.user exists. d.user.id might not be in response if not selected?
                // Let's assume fetching USERS with role DRIVER is safer.
                email: d.user?.email || 'Unknown',
                role: 'DRIVER'
            }));
            // Better: fetch /users directly
            const usersRes = await api.get('/users');
            const driverUsers = usersRes.data.data ? usersRes.data.data : usersRes.data; // Handle pagination if any
            const filtered = driverUsers.filter((u: User) => u.role !== 'ADMIN' && u.id !== user?.id);
            setAvailableUsers(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const START_CHAT = (otherUser: User) => {
        // Check if conversation exists
        const existing = conversations.find(c => c.user.id === otherUser.id);
        if (existing) {
            handleSelectConversation(existing);
        } else {
            // Create temporary conversation object
            const tempConv: Conversation = {
                user: otherUser,
                lastMessage: { content: '', createdAt: new Date().toISOString() } as any,
                unreadCount: 0
            };
            setActiveConversation(tempConv);
            setMessages([]); // Empty initially
        }
        setNewChatOpen(false);
    };

    const filteredConversations = useMemo(() => {
        return conversations.filter(c =>
            c.user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [conversations, searchTerm]);

    const filteredUsers = useMemo(() => {
        return availableUsers.filter(u =>
            u.email.toLowerCase().includes(userSearch.toLowerCase())
        );
    }, [availableUsers, userSearch]);

    if (authLoading) return <div className="p-8 text-center">{t('common.loading')}</div>;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r flex flex-col">
                <div className="p-4 border-b space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{t('messages.title')}</h2>
                        <Button size="icon" variant="ghost" onClick={handleOpenNewChat} title={t('messages.newChat')}>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={t('messages.searchPlaceholder')}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((conv) => (
                        <div
                            key={conv.user.id}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${activeConversation?.user.id === conv.user.id ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                            onClick={() => handleSelectConversation(conv)}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-semibold truncate">{conv.user.email}</span>
                                <span className="text-xs text-gray-500">
                                    {conv.lastMessage?.createdAt && new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600 truncate max-w-[180px]">
                                    {conv.lastMessage?.senderId === user?.id ? `${t('messages.me')}: ` : ''}
                                    {conv.lastMessage?.content}
                                </p>
                                {conv.unreadCount > 0 && (
                                    <Badge variant="destructive" className="rounded-full px-2">
                                        {conv.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            {t('messages.noConversation')}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b bg-white flex items-center px-6 justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{activeConversation.user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{activeConversation.user.email}</div>
                                    <div className="text-xs text-green-500 flex items-center gap-1">
                                        <Circle className="h-2 w-2 fill-green-500" />
                                        {t('messages.online')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'
                                            }`}>
                                            <p>{msg.content}</p>
                                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={t('messages.typeMessage')}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={!newMessage.trim()}>
                                    <Send className="h-4 w-4 mr-2" />
                                    {t('messages.send')}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Send className="h-8 w-8 text-gray-300" />
                        </div>
                        <p>{t('messages.selectConversation')}</p>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('messages.newChat')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={t('messages.searchPlaceholder')}
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                        <div className="max-h-[300px] overflow-y-auto border rounded-md">
                            <Table>
                                <TableBody>
                                    {filteredUsers.map((u) => (
                                        <TableRow
                                            key={u.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => START_CHAT(u)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{u.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{u.email}</span>
                                                    <Badge variant="outline" className="ml-auto">{u.role}</Badge>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
