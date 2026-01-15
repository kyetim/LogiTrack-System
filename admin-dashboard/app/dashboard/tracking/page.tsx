'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TrackingMap } from '@/components/TrackingMap';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface DriverLocation {
    id: string;
    driverId: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    timestamp: string;
    driver: {
        id: string;
        status: string;
        licenseNumber: string;
        user: {
            email: string;
        };
        vehicle?: {
            plateNumber: string;
        };
    };
}

export default function TrackingPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [locations, setLocations] = useState<DriverLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchLocations();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchLocations, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchLocations = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/locations/latest');
            setLocations(data);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
            toast.error('Konumlar yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            <MapPin className="inline h-6 w-6 mr-2" />
                            Canlı Takip
                        </h1>
                        <p className="text-sm text-gray-600">Sürücü konumlarını gerçek zamanlı izleyin</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={fetchLocations} variant="outline" size="sm" disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                        <LanguageSwitcher />
                        <Badge variant="outline">{t(`roles.${user.role}`)}</Badge>
                        <Button onClick={() => router.push('/dashboard')}>{t('users.backToDashboard')}</Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Driver List Sidebar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Aktif Sürücüler ({locations.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[500px] overflow-y-auto">
                                    {locations.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            Aktif sürücü bulunamadı
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {locations.map((location) => (
                                                <button
                                                    key={location.id}
                                                    onClick={() => setSelectedDriver(location)}
                                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedDriver?.id === location.id ? 'bg-blue-50' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {location.driver.user.email.split('@')[0]}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {location.driver.licenseNumber}
                                                            </p>
                                                            {location.driver.vehicle && (
                                                                <p className="text-xs text-gray-500">
                                                                    {location.driver.vehicle.plateNumber}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                location.driver.status === 'ON_DUTY'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="ml-2"
                                                        >
                                                            {location.driver.status === 'ON_DUTY' ? 'Görevde' : 'Görev Dışı'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(location.timestamp).toLocaleTimeString('tr-TR')}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Map */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardContent className="p-0">
                                {isLoading && locations.length === 0 ? (
                                    <div className="h-[600px] flex items-center justify-center">
                                        <div className="text-center">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-500">Harita yükleniyor...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <TrackingMap
                                        locations={locations}
                                        onMarkerClick={(location) => setSelectedDriver(location)}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
