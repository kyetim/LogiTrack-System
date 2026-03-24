'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface SupportTicket {
    id: string;
    ticketNumber: string;
    driver: {
        id: string;
        email: string;
        phoneNumber?: string;
    };
    assignedTo?: {
        id: string;
        email: string;
    };
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    messages: SupportMessage[];
}

interface SupportMessage {
    id: string;
    senderId: string;
    sender: {
        email: string;
        role: string;
    };
    content: string;
    isInternal: boolean;
    isSystemMessage: boolean;
    createdAt: string;
}

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.id as string;

    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [internalNote, setInternalNote] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseURL = 'http://localhost:3000/api';
            const response = await axios.get(`${baseURL}/support/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTicket(response.data);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

    const assignToMe = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseURL = 'http://localhost:3000/api';
            await axios.patch(`${baseURL}/support/tickets/${ticketId}/assign`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTicket();
        } catch (error) {
            console.error('Failed to assign ticket:', error);
        }
    };

    const sendReply = async () => {
        if (!messageText.trim()) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const baseURL = 'http://localhost:3000/api';
            await axios.post(
                `${baseURL}/support/tickets/${ticketId}/messages`,
                { content: messageText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessageText('');
            fetchTicket();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const addInternalNote = async () => {
        if (!internalNote.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const baseURL = 'http://localhost:3000/api';
            await axios.post(
                `${baseURL}/support/tickets/${ticketId}/internal-note`,
                { content: internalNote },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInternalNote('');
            fetchTicket();
        } catch (error) {
            console.error('Failed to add note:', error);
        }
    };

    const updateStatus = async (status: string) => {
        try {
            const token = localStorage.getItem('token');
            const baseURL = 'http://localhost:3000/api';
            await axios.patch(
                `${baseURL}/support/tickets/${ticketId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTicket();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Ticket bulunamadı</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Ticket #{ticket.ticketNumber}
                            </h1>
                            <p className="text-gray-600">{ticket.driver.email}</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        {!ticket.assignedTo && (
                            <button
                                onClick={assignToMe}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Üstlen
                            </button>
                        )}
                        {ticket.status !== 'RESOLVED' && (
                            <button
                                onClick={() => updateStatus('RESOLVED')}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Çözüldü İşaretle
                            </button>
                        )}
                        {ticket.status !== 'CLOSED' && (
                            <button
                                onClick={() => updateStatus('CLOSED')}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Kapat
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Konuşma</h2>
                    </div>

                    <div className="p-6 max-h-[600px] overflow-y-auto space-y-4">
                        {ticket.messages.map((msg) => {
                            if (msg.isSystemMessage) {
                                return (
                                    <div
                                        key={msg.id}
                                        className="flex justify-center"
                                    >
                                        <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            }

                            if (msg.isInternal) {
                                return (
                                    <div key={msg.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-yellow-800">
                                                İÇ NOT
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {msg.sender.email}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{msg.content}</p>
                                    </div>
                                );
                            }

                            const isDriver = msg.sender.role === 'DRIVER';

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isDriver ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-md rounded-lg p-4 ${isDriver
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'bg-blue-600 text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold">
                                                {isDriver ? 'Sürücü' : msg.sender.email}
                                            </span>
                                            <span className="text-xs opacity-75">
                                                {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Input */}
                    {ticket.status !== 'CLOSED' && (
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Cevabınızı yazın..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={sendReply}
                                    disabled={!messageText.trim() || sending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PaperAirplaneIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Internal Note */}
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="İç not ekle (sürücü görmez)..."
                                    value={internalNote}
                                    onChange={(e) => setInternalNote(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addInternalNote()}
                                    className="flex-1 px-4 py-2 border border-yellow-300 bg-yellow-50 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <button
                                    onClick={addInternalNote}
                                    disabled={!internalNote.trim()}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                                >
                                    Not Ekle
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
