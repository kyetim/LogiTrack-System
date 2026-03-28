'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrackingMap, DriverLocation } from '@/components/TrackingMap';
import api from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    MapPin, Wifi, WifiOff, RefreshCw,
    Truck, Users, Activity, Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

type FilterStatus = 'ALL' | 'ON_DUTY' | 'AVAILABLE' | 'OFF_DUTY';

export default function TrackingPage() {
    const [locations, setLocations] = useState<DriverLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
    const [liveUpdateCount, setLiveUpdateCount] = useState(0);

    const { socket, isConnected } = useWebSocket();

    const fetchLocations = useCallback(async () => {
        try {
            const { data } = await api.get('/locations/latest');
            setLocations(data);
            setLastUpdateTime(new Date());
        } catch (e) {
            console.error('Konum verisi alınamadı:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch + 5dk fallback poll
    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, 300_000);
        return () => clearInterval(interval);
    }, [fetchLocations]);

    // Real-time WebSocket updates
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleLocationUpdate = (data: any) => {
            setLastUpdateTime(new Date());
            setLiveUpdateCount(c => c + 1);

            setLocations(prev => {
                const idx = prev.findIndex(l => l.driverId === data.driverId);
                const updatedLoc: DriverLocation = {
                    id: data.driverId,
                    driverId: data.driverId,
                    coordinates: data.coordinates,
                    timestamp: data.timestamp || new Date().toISOString(),
                    driver: prev[idx]
                        ? {
                            ...prev[idx].driver,
                            status: data.driver?.status ?? prev[idx].driver.status,
                            isAvailable: data.driver?.isAvailable ?? prev[idx].driver.isAvailable,
                            isAvailableForWork: data.driver?.isAvailableForWork ?? prev[idx].driver.isAvailableForWork,
                        }
                        : data.driver ?? {
                            id: data.driverId,
                            status: 'ON_DUTY',
                            isAvailable: false,
                            isAvailableForWork: false,
                            licenseNumber: '—',
                            user: { email: data.driverEmail ?? 'Bilinmeyen' },
                        },
                };

                if (idx !== -1) {
                    const next = [...prev];
                    next[idx] = updatedLoc;
                    return next;
                }
                return [...prev, updatedLoc];
            });
        };

        socket.on('location:update', handleLocationUpdate);

        // Handle driver status changes (online/offline toggle)
        const handleDriverStatus = (data: any) => {
            setLocations(prev => {
                const idx = prev.findIndex(l => l.driverId === data.driverId);
                if (idx === -1) return prev; // driver not in list yet, ignore
                const next = [...prev];
                next[idx] = {
                    ...next[idx],
                    driver: {
                        ...next[idx].driver,
                        isAvailable: data.isAvailable ?? next[idx].driver.isAvailable,
                        isAvailableForWork: data.isAvailableForWork ?? next[idx].driver.isAvailableForWork,
                        status: data.status ?? next[idx].driver.status,
                    },
                };
                return next;
            });
            setLastUpdateTime(new Date());
        };

        socket.on('driver:status', handleDriverStatus);
        return () => {
            socket.off('location:update', handleLocationUpdate);
            socket.off('driver:status', handleDriverStatus);
        };

    }, [socket, isConnected]);

    // Filtered list
    const filteredLocations = locations.filter(loc => {
        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'AVAILABLE') return loc.driver.status !== 'OFF_DUTY' && loc.driver.isAvailable;
        return loc.driver.status === filterStatus;
    });

    const stats = {
        total: locations.length,
        onDuty: locations.filter(l => l.driver.status === 'ON_DUTY' && !l.driver.isAvailable).length,
        available: locations.filter(l => l.driver.status !== 'OFF_DUTY' && l.driver.isAvailable).length,
        offDuty: locations.filter(l => l.driver.status === 'OFF_DUTY').length,
    };

    const getDriverDisplayName = (driver: DriverLocation['driver']) => {
        if (driver.user.firstName && driver.user.lastName)
            return `${driver.user.firstName} ${driver.user.lastName}`;
        return driver.user.email.split('@')[0];
    };

    const FILTERS: { label: string; value: FilterStatus; color: string }[] = [
        { label: 'Tümü', value: 'ALL', color: 'bg-slate-100 text-slate-700' },
        { label: 'Görevde', value: 'ON_DUTY', color: 'bg-blue-100 text-blue-700' },
        { label: 'Müsait', value: 'AVAILABLE', color: 'bg-green-100 text-green-700' },
        { label: 'Çevrimdışı', value: 'OFF_DUTY', color: 'bg-slate-100 text-slate-500' },
    ];

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* ── HEADER ── */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Canlı Takip</h1>
                            <p className="text-xs text-slate-500">Gerçek zamanlı sürücü konumları</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* WS Bağlantı Durumu */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {isConnected ? (
                                <><Wifi className="h-3.5 w-3.5" /> Canlı</>
                            ) : (
                                <><WifiOff className="h-3.5 w-3.5" /> Bağlantı Yok</>
                            )}
                        </div>
                        {/* Son güncelleme */}
                        {lastUpdateTime && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(lastUpdateTime, { addSuffix: true, locale: tr })}
                            </span>
                        )}
                        <Button size="sm" variant="outline" onClick={fetchLocations} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                    </div>
                </div>

                {/* ── Stat chips ── */}
                <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold text-slate-900">{stats.total}</span> sürücü
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-semibold text-blue-700">{stats.onDuty}</span>
                        <span className="text-slate-500">görevde</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-semibold text-green-700">{stats.available}</span>
                        <span className="text-slate-500">müsait</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="font-semibold text-slate-600">{stats.offDuty}</span>
                        <span className="text-slate-500">çevrimdışı</span>
                    </div>
                    {liveUpdateCount > 0 && (
                        <>
                            <div className="w-px h-4 bg-slate-200" />
                            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                <Activity className="h-3.5 w-3.5 animate-pulse" />
                                {liveUpdateCount} canlı güncelleme
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* ── BODY ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* ── Sidebar ── */}
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
                    {/* Filtreler */}
                    <div className="p-3 border-b border-slate-100 flex gap-1.5 flex-wrap">
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilterStatus(f.value)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterStatus === f.value
                                    ? f.color + ' ring-2 ring-offset-1 ring-blue-400'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Sürücü listesi */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {filteredLocations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                                <Truck className="h-8 w-8 text-slate-300" />
                                <p className="text-sm text-slate-400">Sürücü bulunamadı</p>
                            </div>
                        ) : (
                            filteredLocations.map(loc => {
                                const isSelected = selectedDriverId === loc.driverId;
                                const color = loc.driver.status === 'OFF_DUTY'
                                    ? '#94a3b8'
                                    : loc.driver.isAvailable ? '#22c55e' : '#3b82f6';

                                return (
                                    <button
                                        key={loc.driverId}
                                        onClick={() => setSelectedDriverId(
                                            isSelected ? null : loc.driverId
                                        )}
                                        className={`w-full p-3 text-left transition-all ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            {/* Status dot */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: color + '20' }}>
                                                    <Truck className="h-4 w-4" style={{ color }} />
                                                </div>
                                                {loc.driver.status !== 'OFF_DUTY' && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                                                        style={{ backgroundColor: color }} />
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {getDriverDisplayName(loc.driver)}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {loc.driver.vehicle && (
                                                        <span className="text-xs text-slate-500 font-mono">
                                                            {loc.driver.vehicle.plateNumber}
                                                        </span>
                                                    )}
                                                    <span className="text-xs"
                                                        style={{ color, fontWeight: 600 }}>
                                                        {loc.driver.status === 'OFF_DUTY'
                                                            ? 'Çevrimdışı'
                                                            : loc.driver.isAvailable ? 'Müsait' : 'Görevde'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Son güncelleme */}
                                            <p className="text-[10px] text-slate-400 flex-shrink-0">
                                                {formatDistanceToNow(new Date(loc.timestamp), {
                                                    addSuffix: false, locale: tr,
                                                })}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* ── Map ── */}
                <div className="flex-1 relative">
                    {isLoading && locations.length === 0 ? (
                        <div className="h-full flex items-center justify-center bg-slate-50">
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                                <p className="text-sm text-slate-500">Sürücü konumları yükleniyor...</p>
                            </div>
                        </div>
                    ) : (
                        <TrackingMap
                            locations={filteredLocations}
                            selectedDriverId={selectedDriverId}
                            onMarkerClick={loc => setSelectedDriverId(loc.driverId)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
