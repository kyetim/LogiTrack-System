'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import { MapPin, Navigation, Check } from 'lucide-react';

interface Driver {
    id: string;
    user: {
        id: string;
        email: string;
    };
    currentLocation?: {
        lat: number;
        lng: number;
    };
    lastLocationUpdate?: string;
    isAvailableForWork: boolean;
}

interface NearbyShipment {
    id: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    status: string;
    distance_meters: number;
}

interface MatchSuggestion {
    driver: Driver;
    nearbyShipments: NearbyShipment[];
}

export function SmartMatchingCard() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchAvailableDrivers();
    }, []);

    const fetchAvailableDrivers = async () => {
        try {
            const { data } = await api.get('/drivers');
            // Filter for drivers with location data and available for work
            const availableDrivers = data.filter((d: Driver) =>
                d.currentLocation && d.isAvailableForWork
            );
            setDrivers(availableDrivers);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        }
    };

    const loadSmartSuggestions = async () => {
        setIsLoading(true);
        try {
            // For each available driver, fetch their nearby shipments
            const matchPromises = drivers.map(async (driver) => {
                try {
                    // We need to call the backend with raw SQL or create a new endpoint
                    // For now, we'll use a simplified approach
                    const { data } = await api.get(`/shipments/nearby`, {
                        params: { driverId: driver.id, radius: 50 }
                    });
                    return {
                        driver,
                        nearbyShipments: data || []
                    };
                } catch (error) {
                    return { driver, nearbyShipments: [] };
                }
            });

            const results = await Promise.all(matchPromises);
            // Filter to only show drivers with nearby shipments
            const validSuggestions = results.filter(r => r.nearbyShipments.length > 0);
            setSuggestions(validSuggestions);
        } catch (error) {
            toast.error('Eşleştirmeler yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async (driverId: string, shipmentId: string) => {
        try {
            await api.patch(`/shipments/${shipmentId}/assign`, { driverId });
            toast.success('Sürücü atandı!');
            loadSmartSuggestions(); // Refresh
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Atama başarısız');
        }
    };

    const formatDistance = (meters: number) => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    return (
        <Card className="col-span-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-600" />
                            Akıllı İş Eşleştirme
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Konuma göre sürücü-görev önerileri
                        </p>
                    </div>
                    <Button onClick={loadSmartSuggestions} disabled={isLoading || drivers.length === 0}>
                        <Navigation className="h-4 w-4 mr-2" />
                        {isLoading ? 'Yükleniyor...' : 'Önerileri Getir'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {drivers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Konum paylaşan ve müsait olan sürücü bulunamadı.</p>
                    </div>
                )}

                {suggestions.length === 0 && drivers.length > 0 && !isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Önerileri görmek için "Önerileri Getir" butonuna tıklayın.</p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                        <p className="mt-3 text-sm text-muted-foreground">Yakındaki işler hesaplanıyor...</p>
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="space-y-4">
                        {suggestions.map((suggestion) => (
                            <div key={suggestion.driver.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-transparent">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                                            {suggestion.driver.user.email}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {suggestion.nearbyShipments.length} yakın görev bulundu
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-white">
                                        Müsait
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    {suggestion.nearbyShipments.map((shipment) => (
                                        <div
                                            key={shipment.id}
                                            className="flex items-center justify-between bg-white p-3 rounded border"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs font-semibold">
                                                        {shipment.trackingNumber}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {formatDistance(shipment.distance_meters)}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Navigation className="h-3 w-3" />
                                                    <span className="truncate max-w-xs">
                                                        {shipment.origin} → {shipment.destination}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleAssign(suggestion.driver.id, shipment.id)}
                                                className="ml-3"
                                            >
                                                <Check className="h-3 w-3 mr-1" />
                                                Ata
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
