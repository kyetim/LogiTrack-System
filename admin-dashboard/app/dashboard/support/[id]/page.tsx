'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, User, Clock, Tag } from 'lucide-react';

interface SupportTicket {
    id: string;
    ticketNumber: string;
    driverId: string;
    driver: {
        id: string;
        email: string;
        phoneNumber?: string;
    };
    assignedToId?: string;
    assignedTo?: {
        id: string;
        email: string;
    };
    subject: string;
    status: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    createdAt: string;
    updatedAt: string;
    messages: Array<{
        id: string;
        content: string;
        isSystemMessage: boolean;
        createdAt: string;
        sender?: {
            id: string;
            email: string;
            role: string;
        };
    }>;
}

export default function SupportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchTicket();
        }
    }, [params.id]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/support/tickets/${params.id}`);
            setTicket(response.data);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!reply.trim()) return;

        try {
            setSending(true);
            await api.post(`/support/tickets/${params.id}/messages`, { content: reply });
            setReply('');
            fetchTicket();
        } catch (error) {
            console.error('Failed to send reply:', error);
            alert('Mesaj gönderilemedi');
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (status: string) => {
        try {
            await api.patch(`/support/tickets/${params.id}/status`, { status });
            fetchTicket();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const getPriorityBadge = (priority: string) => {
        const styles = {
            LOW: 'bg-green-100 text-green-800',
            NORMAL: 'bg-yellow-100 text-yellow-800',
            HIGH: 'bg-orange-100 text-orange-800',
            URGENT: 'bg-red-100 text-red-800',
        };
        const labels = {
            LOW: '🟢 Düşük',
            NORMAL: '🟡 Normal',
            HIGH: '🟠 Yüksek',
            URGENT: '🔴 ACİL',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[priority as keyof typeof styles]}`}>
                {labels[priority as keyof typeof labels]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6">
                <p className="text-red-600">Ticket bulunamadı</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Ticket #{ticket.ticketNumber}</h1>
                    <p className="text-gray-600">{ticket.subject}</p>
                </div>
                {getPriorityBadge(ticket.priority)}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Sürücü</span>
                    </div>
                    <p className="font-semibold">{ticket.driver.email}</p>
                    {ticket.driver.phoneNumber && (
                        <p className="text-sm text-gray-600">{ticket.driver.phoneNumber}</p>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Tarih</span>
                    </div>
                    <p className="font-semibold">
                        {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-sm text-gray-600">
                        {new Date(ticket.createdAt).toLocaleTimeString('tr-TR')}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Durum</span>
                    </div>
                    <select
                        value={ticket.status}
                        onChange={(e) => updateStatus(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="OPEN">Açık</option>
                        <option value="ASSIGNED">Atandı</option>
                        <option value="IN_PROGRESS">İşlemde</option>
                        <option value="WAITING_REPLY">Cevap Bekleniyor</option>
                        <option value="RESOLVED">Çözüldü</option>
                        <option value="CLOSED">Kapatıldı</option>
                    </select>
                </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Mesajlar</h2>
                </div>
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {ticket.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`p-4 rounded-lg ${message.isSystemMessage
                                ? 'bg-gray-50 border border-gray-200'
                                : message.sender?.role === 'DRIVER'
                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                    : 'bg-green-50 border-l-4 border-green-500'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-sm">
                                    {message.isSystemMessage
                                        ? 'SISTEM'
                                        : message.sender?.email || 'Bilinmeyen'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(message.createdAt).toLocaleString('tr-TR')}
                                </span>
                            </div>
                            <p className="text-gray-800">{message.content}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reply Section */}
            {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-bold mb-3">Cevap Yaz</h3>
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        className="w-full p-3 border rounded-lg resize-none"
                        rows={4}
                    />
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleSendReply}
                            disabled={!reply.trim() || sending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            {sending ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
