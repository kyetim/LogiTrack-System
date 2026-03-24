'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';

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
    messages: any[];
}

export default function SupportPage() {
    const router = useRouter();
    const { socket } = useSocket();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'urgent'>('pending');

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/support/tickets');

            let filteredTickets = response.data;

            if (filter === 'pending') {
                // WAITING_REPLY = sürücü mesaj gönderdi, admin cevap bekliyor
                filteredTickets = filteredTickets.filter(
                    (t: SupportTicket) => t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_REPLY'
                );
            } else if (filter === 'urgent') {
                filteredTickets = filteredTickets.filter(
                    (t: SupportTicket) => t.priority === 'URGENT'
                );
            }

            setTickets(filteredTickets);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Real-time: refetch when a new ticket or message arrives
    useEffect(() => {
        if (!socket) return;
        const handleNewTicket = () => fetchTickets();
        const handleNewMessage = () => fetchTickets();
        socket.on('support:new-ticket', handleNewTicket);
        socket.on('support:new-message', handleNewMessage);
        return () => {
            socket.off('support:new-ticket', handleNewTicket);
            socket.off('support:new-message', handleNewMessage);
        };
    }, [socket, fetchTickets]);


    const getPriorityBadge = (priority: string) => {
        const styles = {
            LOW: 'bg-green-100 text-green-800 border-green-300',
            NORMAL: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
            URGENT: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
        };
        const labels = {
            LOW: '🟢 Düşük',
            NORMAL: '🟡 Normal',
            HIGH: '🟠 Yüksek',
            URGENT: '🔴 ACİL',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[priority as keyof typeof styles]}`}>
                {labels[priority as keyof typeof labels]}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            OPEN: 'bg-blue-100 text-blue-800',
            ASSIGNED: 'bg-indigo-100 text-indigo-800',
            IN_PROGRESS: 'bg-purple-100 text-purple-800',
            WAITING_REPLY: 'bg-yellow-100 text-yellow-800',
            RESOLVED: 'bg-green-100 text-green-800',
            CLOSED: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Destek Talepleri</h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'pending'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Bekleyen
                    </button>
                    <button
                        onClick={() => setFilter('urgent')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'urgent'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        🔴 ACİL
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        {filter === 'urgent' ? 'Acil talep yok' : 'Talep bulunamadı'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                            className={`bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6 border-l-4 ${ticket.priority === 'URGENT'
                                ? 'border-red-500'
                                : ticket.priority === 'HIGH'
                                    ? 'border-orange-500'
                                    : ticket.priority === 'NORMAL'
                                        ? 'border-yellow-500'
                                        : 'border-green-500'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Ticket #{ticket.ticketNumber}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Sürücü: {ticket.driver.email}
                                        {ticket.driver.phoneNumber && ` • ${ticket.driver.phoneNumber}`}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {getPriorityBadge(ticket.priority)}
                                    {getStatusBadge(ticket.status)}
                                </div>
                            </div>

                            <p className="text-gray-700 mb-3">{ticket.subject}</p>

                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>
                                    {new Date(ticket.createdAt).toLocaleString('tr-TR')}
                                </span>
                                {ticket.assignedTo && (
                                    <span className="text-blue-600">
                                        Atanan: {ticket.assignedTo.email}
                                    </span>
                                )}
                                <span>
                                    {ticket.messages.length} mesaj
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
