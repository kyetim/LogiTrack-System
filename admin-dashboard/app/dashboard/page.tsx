'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { SmartMatchingCard } from '@/components/SmartMatchingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { Users, Truck, Package, MapPin, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { LogisticCapacityAnalysis } from '@/components/LogisticCapacityAnalysis';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
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
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            loadDashboardData();
        }
    }, [user, period]);

    const loadDashboardData = async () => {
        setLoadingData(true);
        try {
            await Promise.all([fetchStats(), fetchAnalytics()]);
        } finally {
            // Artificial delay to show off the skeleton loader (optional, remove in prod)
            setTimeout(() => setLoadingData(false), 800);
        }
    };

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

    if (isLoading || loadingData) {
        return <DashboardSkeleton />;
    }

    if (!user) return null;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Genel Bakış</h2>
                    <p className="text-gray-500">Şirket performansını ve operasyonlarını anlık takip edin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Son 24 Saat</SelectItem>
                            <SelectItem value="7d">Son 7 Gün</SelectItem>
                            <SelectItem value="30d">Son 30 Gün</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bento Grid Layout - Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="relative overflow-hidden border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">
                            {t('dashboard.totalUsers')}
                        </CardTitle>
                        <Users className="h-4 w-4 text-primary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.users}</div>
                        <p className="text-xs text-primary-foreground/80 mt-1">+12% geçen haftaya göre</p>
                        <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-soft bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-foreground/90">
                            {t('dashboard.activeDrivers')}
                        </CardTitle>
                        <Truck className="h-4 w-4 text-secondary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.drivers}</div>
                        <p className="text-xs text-secondary-foreground/80 mt-1">Şu an aktif</p>
                        <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-soft bg-gradient-to-br from-accent to-accent/90 text-accent-foreground">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-accent-foreground/90">
                            {t('dashboard.fleetVehicles')}
                        </CardTitle>
                        <MapPin className="h-4 w-4 text-accent-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.vehicles}</div>
                        <p className="text-xs text-accent-foreground/80 mt-1">Tüm filo</p>
                        <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-soft bg-gradient-to-br from-[#3A4F41] to-[#2E5B43] text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">
                            {t('dashboard.totalShipments')}
                        </CardTitle>
                        <Package className="h-4 w-4 text-white/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.shipments}</div>
                        <p className="text-xs text-white/80 mt-1">Bu ayki hedefler</p>
                        <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
                    </CardContent>
                </Card>
            </div>

            {/* Bento Grid - Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Main Analytics Chart (Spans 4 columns) */}
                <div className="lg:col-span-4 space-y-6">
                    {analytics && <AnalyticsCharts data={analytics} />}
                </div>

                {/* Secondary Panels (Spans 3 columns) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Capacity Analysis - Nature Inspired Art */}
                    <div className="h-[400px]">
                        <LogisticCapacityAnalysis />
                    </div>

                    {/* Quick Stats Mini Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="glass-card border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Başarı Oranı</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-foreground">{analytics?.summary?.completionRate || 0}%</span>
                                    <TrendingUp className="h-4 w-4 text-primary mb-1" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass-card border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ort. Teslimat</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-foreground">42dk</span>
                                    <Clock className="h-4 w-4 text-secondary mb-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Recent Activity or Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-3 border-none shadow-soft bg-gradient-to-r from-primary/90 to-primary text-primary-foreground overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-accent" />
                            <CardTitle>Sistem Durumu</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1">
                                <h4 className="font-medium text-primary-foreground/90 mb-2">Sunucu Metrikleri</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary-foreground/70">CPU Kullanımı</span>
                                        <span>%12</span>
                                    </div>
                                    <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-accent h-full w-[12%]"></div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary-foreground/70">Bellek</span>
                                        <span>%45</span>
                                    </div>
                                    <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-accent/80 h-full w-[45%]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
                                <h4 className="font-medium text-primary-foreground/90 mb-2">Canlı Operasyon</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold">14</div>
                                        <div className="text-xs text-primary-foreground/70">Aktif Sevkiyat</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">3</div>
                                        <div className="text-xs text-primary-foreground/70">Bekleyen Talep</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
