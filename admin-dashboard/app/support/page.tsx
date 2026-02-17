'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    UserCircleIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

interface SupportTicket {
    id: string;
    ticketNumber: string;
    driver: {
        email: string;
        phoneNumber?: string;
    };
    assignedTo?: {
        email: string;
    };
    subject: string;
    status: 'OPEN' | 'ASSIGNED' | 'WAITING_REPLY' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    createdAt: string;
    messages: any[];
}

interface SupportStats {
    openCount: number;
    assignedCount: number;
    resolvedToday: number;
    avgResponseTimeMinutes: number;
}

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [stats, setStats] = useState<SupportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseURL = 'http://localhost:3000/api';
            const url =
                statusFilter === 'all'
                    ? `${baseURL}/support/tickets`
                    : `${baseURL}/support/tickets?status=${statusFilter}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTickets(response.data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseURL = 'http://localhost:3000/api';
            const response = await axios.get(`${baseURL}/support/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        Promise.all([fetchTickets(), fetchStats()]).finally(() => setLoading(false));
    }, [statusFilter]);

    const getStatusBadge = (status: SupportTicket['status']) => {
        const badgeClasses = {
            OPEN: 'bg-yellow-100 text-yellow-800',
            ASSIGNED: 'bg-blue-100 text-blue-800',
            WAITING_REPLY: 'bg-orange-100 text-orange-800',
            IN_PROGRESS: 'bg-purple-100 text-purple-800',
            RESOLVED: 'bg-green-100 text-green-800',
            CLOSED: 'bg-gray-100 text-gray-800',
        };

        const labels = {
            OPEN: 'Açık',
            ASSIGNED: 'Atandı',
            WAITING_REPLY: 'Cevap Bekleniyor',
            IN_PROGRESS: 'Devam Ediyor',
            RESOLVED: 'Çözüldü',
            CLOSED: 'Kapalı',
        };

        return (
            <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeClasses[status]}`}
            >
                {labels[status]}
            </span>
        );
    };

    const getPriorityBadge = (priority: SupportTicket['priority']) => {
        const classes = {
            LOW: 'text-gray-500',
            NORMAL: 'text-blue-500',
            HIGH: 'text-orange-500',
            URGENT: 'text-red-500',
        };

        const labels = {
            LOW: 'Düşük',
            NORMAL: 'Normal',
            HIGH: 'Yüksek',
            URGENT: 'Acil',
        };

        return <span className={`text-xs font-medium ${classes[priority]}`}>{labels[priority]}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Destek Talepleri</h1>
                    <p className="text-gray-600 mt-1">Sürücü destek taleplerini yönet ve cevapla</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Açık Talepler</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.openCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <UserCircleIcon className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Atanmış</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.assignedCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Bugün Çözülen</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ClockIcon className="h-8 w-8 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Ort. Yanıt Süresi</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.avgResponseTimeMinutes}dk
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="flex items-center gap-4">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <select
                            className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tümü</option>
                            <option value="OPEN">Açık</option>
                            <option value="ASSIGNED">Atandı</option>
                            <option value="WAITING_REPLY">Cevap Bekleniyor</option>
                            <option value="IN_PROGRESS">Devam Ediyor</option>
                            <option value="RESOLVED">Çözüldü</option>
                            <option value="CLOSED">Kapalı</option>
                        </select>
                    </div>
                </div>

                {/* Tickets List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ticket #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sürücü
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Konu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Durum
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Öncelik
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Atanan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Oluşturulma
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        İşlem
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                            <p>Henüz destek talebi yok</p>
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                {ticket.ticketNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {ticket.driver.email}
                                                    </div>
                                                    {ticket.driver.phoneNumber && (
                                                        <div className="text-xs text-gray-500">
                                                            {ticket.driver.phoneNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {ticket.subject}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(ticket.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPriorityBadge(ticket.priority)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {ticket.assignedTo?.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <a
                                                    href={`/support/${ticket.id}`}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Detay →
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
