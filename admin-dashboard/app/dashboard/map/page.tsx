"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import map component (Leaflet is client-side only)
const LiveDriverMap = dynamic(
    () => import('@/components/LiveDriverMap'),
    {
        loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 rounded-lg animate-pulse">Loading Map...</div>,
        ssr: false
    }
);

interface Driver {
    id: string;
    user: {
        firstName: string;
        lastName: string;
        phone: string;
    };
    locationCoordinates: {
        latitude: number;
        longitude: number;
    } | null;
    status: 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY';
    isAvailableForWork: boolean;
    lastLocationUpdate: string;
}

export default function MapPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            // Using the public endpoint or protected one depending on auth
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/drivers/active`, {
                headers: {
                    // Assuming token is handled by cookie or localStorage in real app
                    // For dev, we might strictly need auth if backend enforces it
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDrivers(data);
                setLastUpdated(new Date());
            } else {
                console.error('Failed to fetch drivers');
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();

        // Auto refresh every 30 seconds
        const interval = setInterval(fetchDrivers, 30000);
        return () => clearInterval(interval);
    }, []);

    const activeDrivers = drivers.filter(d => d.status !== 'OFF_DUTY').length;
    const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE' && d.isAvailableForWork).length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Live Map</h1>
                    <p className="text-muted-foreground">
                        Real-time tracking of active drivers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">
                        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
                    </span>
                    <Button variant="outline" size="sm" onClick={fetchDrivers} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drivers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active (On Duty)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{activeDrivers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available for Work</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{availableDrivers}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Driver Locations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[600px] w-full rounded-md border overflow-hidden relative">
                        <LiveDriverMap drivers={drivers} />

                        {/* Legend */}
                        <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow-lg z-[1000] text-sm space-y-1">
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                                <span>Available</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                                <span>On Duty (Busy)</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                                <span>Off Duty</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
