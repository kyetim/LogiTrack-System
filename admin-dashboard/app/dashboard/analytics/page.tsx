'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { DriverLeaderboard } from '@/components/DriverLeaderboard';
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
import { BarChart, Activity, Map, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [period, setPeriod] = useState('7d');
    const [basicAnalytics, setBasicAnalytics] = useState<any>(null);
    const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchAllAnalytics();
        }
    }, [user, period]);

    const fetchAllAnalytics = async () => {
        setIsLoading(true);
        try {
            const [basicRes, detailedRes] = await Promise.all([
                api.get(`/analytics/dashboard?period=${period}`),
                api.get(`/analytics/detailed?period=${period}`),
            ]);
            setBasicAnalytics(basicRes.data);
            setDetailedAnalytics(detailedRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Analiz verileri yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Analizler yükleniyor...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            <BarChart className="inline h-6 w-6 mr-2" />
                            Gelişmiş Analitik
                        </h1>
                        <p className="text-sm text-gray-600">Filo performansı ve detaylı raporlar</p>
                    </div>
                    <div className="flex items-center gap-4">
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
                        <LanguageSwitcher />
                        <Button onClick={() => router.push('/dashboard')}>{t('users.backToDashboard')}</Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Detailed Stats */}
                {detailedAnalytics?.fleetStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Toplam Mesafe (Filo)</CardTitle>
                                <Map className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{detailedAnalytics.fleetStats.totalDistance.toLocaleString()} km</div>
                                <p className="text-xs text-gray-500 mt-1">Bu periyotta kat edilen toplam yol</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Ortalama Hız</CardTitle>
                                <Activity className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{detailedAnalytics.fleetStats.averageSpeed} km/h</div>
                                <p className="text-xs text-gray-500 mt-1">Aktif sürüş sırasındaki ortalama</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Aktif Sürücüler</CardTitle>
                                <Navigation className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{detailedAnalytics.fleetStats.activeDrivers}</div>
                                <p className="text-xs text-gray-500 mt-1">GPS verisi gönderen sürücüler</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Leaderboard */}
                {detailedAnalytics?.leaderboard && (
                    <DriverLeaderboard data={detailedAnalytics.leaderboard} />
                )}

                {/* Legacy Charts */}
                {basicAnalytics && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Operasyonel Grafikler</h2>
                        <AnalyticsCharts data={basicAnalytics} />
                    </div>
                )}
            </main>
        </div>
    );
}
