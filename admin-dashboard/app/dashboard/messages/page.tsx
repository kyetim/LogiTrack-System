'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
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
    const { messageSocket } = useSocket(); // Use shared socket
    const router = useRouter();
    const t = useTranslations();
    // const [socket, setSocket] = useState<Socket | null>(null); // Removed local socket state
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
            // connectSocket(); // Removed local connect
        }
        // Socket cleanup handled by Context
    }, [user]);

    // Socket Event Handling
    useEffect(() => {
        if (!messageSocket) return;

        // Attach listeners to shared socket
        const onNewMessage = (message: Message) => {
            handleNewMessage(message);
        };

        const onMessageRead = (data: { messageId: string; readAt: string }) => {
            handleMessageRead(data.messageId);
        };

        messageSocket.on('newMessage', onNewMessage);
        messageSocket.on('messageRead', onMessageRead);

        return () => {
            // Remove listeners on cleanup to avoid duplicates when re-mounting
            messageSocket.off('newMessage', onNewMessage);
            messageSocket.off('messageRead', onMessageRead);
        };
    }, [messageSocket, activeConversation]); // Re-attach if activeConversation changes (for handleNewMessage closure)


    /* Removed connectSocket function */

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
        <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {/* Master Integrated Panel Container */}
            <div className="flex w-full max-w-[1600px] mx-auto rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-2xl">

                {/* Sidebar - Integrated */}
                <div className="w-[350px] border-r border-slate-200/60 flex flex-col bg-white/40">
                    <div className="px-4 py-4 border-b border-slate-200/60 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-foreground">{t('messages.title')}</h2>
                            <Button size="icon" variant="ghost" onClick={handleOpenNewChat} title={t('messages.newChat')}>
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('messages.searchPlaceholder')}
                                className="pl-9 bg-slate-50/50 border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.map((conv) => {
                            const isActive = activeConversation?.user.id === conv.user.id;
                            const initials = conv.user.email.substring(0, 2).toUpperCase();

                            return (
                                <div
                                    key={conv.user.id}
                                    className={`
                                        relative flex items-start gap-3 p-3 cursor-pointer 
                                        border-b border-slate-200/50 
                                        transition-all duration-200
                                        ${isActive
                                            ? 'bg-blue-50/50 border-l-4 border-[#003366]'
                                            : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                                        }
                                    `}
                                    onClick={() => handleSelectConversation(conv)}
                                >
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center shadow-sm">
                                            <span className="text-sm font-semibold text-white">
                                                {initials}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="font-bold text-foreground text-sm truncate">
                                                {conv.user.email}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                {conv.lastMessage?.createdAt &&
                                                    new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] text-muted-foreground/70 truncate flex-1">
                                                {conv.lastMessage?.senderId === user?.id && (
                                                    <span className="font-medium">{t('messages.me')}: </span>
                                                )}
                                                {conv.lastMessage?.content || ''}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <div className="flex-shrink-0">
                                                    <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white">
                                                            {conv.unreadCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredConversations.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                {t('messages.noConversation')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area - Integrated */}
                <div className="flex-1 flex flex-col">
                    {activeConversation ? (
                        <>
                            <div className="px-6 py-4 border-b border-slate-200/40 bg-white/30">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-11 w-11 border-2 border-white/60 shadow-sm">
                                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/40 text-white font-semibold">
                                            {activeConversation.user.email.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-foreground tracking-tight text-base">
                                            {activeConversation.user.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                                <Circle className="h-2 w-2 fill-green-500 animate-pulse" />
                                                {t('messages.online')}
                                            </div>
                                            <span className="text-gray-400 text-[10px]"> • </span>
                                            <span className="text-gray-400 text-[10px]">34 ABC 123 | Scania R450</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-20 py-6 space-y-6 bg-gradient-to-b from-slate-50/30 to-transparent">
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`
                                                    max-w-[65%] rounded-2xl px-4 py-3 
                                                    ${isMe
                                                        ? 'bg-gradient-to-br from-[#003366] to-[#1E40AF] text-white shadow-lg shadow-primary/20'
                                                        : 'bg-white/80 border border-slate-100 text-gray-800 shadow-sm'
                                                    }
                                                    transition-all duration-200 hover:shadow-xl
                                                `}
                                            >
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <div className={`text-[10px] mt-1.5 text-right font-medium ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="px-20 pb-6 pt-2">
                                <form
                                    onSubmit={handleSendMessage}
                                    className="bg-white rounded-full shadow-lg border border-slate-200/60 flex items-center gap-2 px-4 py-2.5 hover:shadow-xl transition-all duration-200 focus-within:border-primary"
                                >
                                    <button type="button" className="flex-shrink-0 text-slate-400 hover:text-primary transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={t('messages.typeMessage')}
                                        className="flex-1 border-0 bg-slate-50 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 rounded-full"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        size="sm"
                                        className="rounded-full h-9 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                            <div className="h-20 w-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-inner">
                                <Send className="h-10 w-10 text-slate-300" />
                            </div>
                            <p className="text-muted-foreground font-medium">{t('messages.selectConversation')}</p>
                        </div>
                    )}
                </div>
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
