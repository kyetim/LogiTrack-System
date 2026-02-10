'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { Users, Truck, Package, MapPin, TrendingUp, TrendingDown, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [period, setPeriod] = useState('7d');
    const [stats, setStats] = useState({
        users: 0,
        drivers: 0,
        vehicles: 0,
        shipments: 0,
    });
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchAnalytics();
        }
    }, [user, period]);

    const fetchStats = async () => {
        try {
            const [usersRes, driversRes, vehiclesRes, shipmentsRes] = await Promise.all([
                api.get('/users'),
                api.get('/drivers'),
                api.get('/vehicles'),
                api.get('/shipments'),
            ]);

            setStats({
                users: usersRes.data.data?.length || usersRes.data.length || 0,
                drivers: driversRes.data.length || 0,
                vehicles: vehiclesRes.data.length || 0,
                shipments: shipmentsRes.data.length || 0,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const { data } = await api.get(`/analytics/dashboard?period=${period}`);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                        <p className="text-sm text-gray-600">{t('dashboard.welcomeBack')}, {user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Badge variant="outline">{t(`roles.${user.role}`)}</Badge>
                        <Button onClick={logout} variant="outline">{t('common.logout')}</Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Period Selector */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Analytics</h2>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Son 24 Saat</SelectItem>
                            <SelectItem value="7d">Son 7 Gün</SelectItem>
                            <SelectItem value="30d">Son 30 Gün</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {t('dashboard.totalUsers')}
                            </CardTitle>
                            <Users className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.users}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {t('dashboard.activeDrivers')}
                            </CardTitle>
                            <Truck className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.drivers}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {t('dashboard.fleetVehicles')}
                            </CardTitle>
                            <MapPin className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.vehicles}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {t('dashboard.totalShipments')}
                            </CardTitle>
                            <Package className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.shipments}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Metrics */}
                {analytics?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Toplam Sevkiyat
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.summary.totalShipments}</div>
                                <p className="text-xs text-gray-500 mt-1">{period === '24h' ? 'Son 24 saat' : period === '7d' ? 'Son 7 gün' : 'Son 30 gün'}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Tamamlanan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl font-bold text-green-600">{analytics.summary.completedShipments}</div>
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Teslim edildi</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Başarı Oranı
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{analytics.summary.completionRate}%</div>
                                <p className="text-xs text-gray-500 mt-1">Tamamlanma oranı</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Analytics Charts */}
                {analytics && <AnalyticsCharts data={analytics} />}

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <Button variant="outline" className="h-20" onClick={() => router.push('/dashboard/users')}>
                                <div className="text-center">
                                    <Users className="h-6 w-6 mx-auto mb-2" />
                                    <div className="text-sm">{t('dashboard.manageUsers')}</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-20" onClick={() => router.push('/dashboard/drivers')}>
                                <div className="text-center">
                                    <Truck className="h-6 w-6 mx-auto mb-2" />
                                    <div className="text-sm">{t('dashboard.manageDrivers')}</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-20" onClick={() => router.push('/dashboard/vehicles')}>
                                <div className="text-center">
                                    <MapPin className="h-6 w-6 mx-auto mb-2" />
                                    <div className="text-sm">{t('dashboard.manageVehicles')}</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-20" onClick={() => router.push('/dashboard/shipments')}>
                                <div className="text-center">
                                    <Package className="h-6 w-6 mx-auto mb-2" />
                                    <div className="text-sm">{t('dashboard.manageShipments')}</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-20 bg-blue-50 border-blue-200 hover:bg-blue-100" onClick={() => router.push('/dashboard/tracking')}>
                                <div className="text-center">
                                    <MapPin className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                                    <div className="text-sm font-medium text-blue-600">Canlı Takip</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-20 bg-purple-50 border-purple-200 hover:bg-purple-100" onClick={() => router.push('/dashboard/analytics')}>
                                <div className="text-center">
                                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                                    <div className="text-sm font-medium text-purple-600">Detaylı Analiz</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-20 bg-green-50 border-green-200 hover:bg-green-100" onClick={() => router.push('/dashboard/messages')}>
                                <div className="text-center">
                                    <MessageSquare className="h-6 w-6 mx-auto mb-2 text-green-600" />
                                    <div className="text-sm font-medium text-green-600">{t('messages.title')}</div>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
