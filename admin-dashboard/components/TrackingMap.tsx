'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    GoogleMap, useJsApiLoader, OverlayView, InfoWindow,
} from '@react-google-maps/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export interface DriverLocation {
    id: string;
    driverId: string;
    coordinates: { latitude: number; longitude: number };
    timestamp: string;
    driver: {
        id: string;
        status: string;
        isAvailable: boolean;
        isAvailableForWork: boolean;
        licenseNumber: string;
        user: { email: string; firstName?: string; lastName?: string };
        vehicle?: { plateNumber: string };
    };
}

interface TrackingMapProps {
    locations: DriverLocation[];
    selectedDriverId?: string | null;
    onMarkerClick?: (location: DriverLocation) => void;
}

const MAP_CONTAINER = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 41.0082, lng: 28.9784 };
const GOOGLE_MAPS_API_KEY = 'AIzaSyAdETeNnMfcZb1TXScSvqJkRIoQW7ufVcU';

// Standard (açık) harita stili — Google default
const LIGHT_MAP_OPTIONS: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#f8d36b' }],
        },
        {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#aad3df' }],
        },
    ],
};

// Sürücü durumuna göre renk & label
const getDriverColor = (driver: DriverLocation['driver']): string => {
    if (driver.status === 'OFF_DUTY') return '#94a3b8';
    if (driver.status === 'ON_DUTY' && !driver.isAvailable) return '#3b82f6';
    return '#22c55e';
};

const getDriverLabel = (driver: DriverLocation['driver']): string => {
    if (driver.status === 'OFF_DUTY') return 'Görev Dışı';
    if (driver.status === 'ON_DUTY' && !driver.isAvailable) return 'Görevde';
    return 'Müsait';
};

const getDriverName = (driver: DriverLocation['driver']): string => {
    if (driver.user.firstName && driver.user.lastName) {
        return `${driver.user.firstName} ${driver.user.lastName}`;
    }
    return driver.user.email.split('@')[0];
};

// SVG truck marker — inline OverlayView ile
function DriverMarker({
    location,
    isSelected,
    onClick,
}: {
    location: DriverLocation;
    isSelected: boolean;
    onClick: () => void;
}) {
    const color = getDriverColor(location.driver);

    return (
        <OverlayView
            position={{
                lat: location.coordinates.latitude,
                lng: location.coordinates.longitude,
            }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div
                onClick={onClick}
                style={{
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    userSelect: 'none',
                }}
            >
                {/* Pulse ring animasyonu */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(location.driver.status !== 'OFF_DUTY') && (
                        <div style={{
                            position: 'absolute',
                            width: isSelected ? 52 : 44,
                            height: isSelected ? 52 : 44,
                            borderRadius: '50%',
                            border: `2px solid ${color}`,
                            opacity: 0.35,
                            animation: 'logitrack-pulse 2s infinite',
                        }} />
                    )}
                    {/* Ana ikon */}
                    <div style={{
                        width: isSelected ? 40 : 34,
                        height: isSelected ? 40 : 34,
                        borderRadius: '50%',
                        backgroundColor: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isSelected
                            ? `0 0 0 3px white, 0 4px 16px ${color}88`
                            : `0 2px 8px ${color}66`,
                        transition: 'all 0.3s ease',
                        border: '2px solid white',
                    }}>
                        {/* Kamyon SVG */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-7 1V9.5h2.5L17 12h-4zm-9.5 8.5c-.83 0-1.5-.67-1.5-1.5S2.67 15 3.5 15s1.5.67 1.5 1.5S4.33 17.5 3.5 17.5zm13 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                        </svg>
                    </div>
                </div>
                {/* İsim etiketi */}
                <div style={{
                    backgroundColor: 'white',
                    color: '#1e293b',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    border: `1.5px solid ${color}`,
                }}>
                    {getDriverName(location.driver)}
                </div>
            </div>
        </OverlayView>
    );
}

export function TrackingMap({ locations, selectedDriverId, onMarkerClick }: TrackingMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [infoDriver, setInfoDriver] = useState<DriverLocation | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    // CSS animasyonu için global style injection
    useEffect(() => {
        const styleId = 'logitrack-map-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @keyframes logitrack-pulse {
                0%   { transform: scale(0.95); opacity: 0.5; }
                70%  { transform: scale(1.4);  opacity: 0; }
                100% { transform: scale(0.95); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }, []);

    // Seçili sürücüye zoom
    useEffect(() => {
        if (!map || !selectedDriverId) return;
        const loc = locations.find(l => l.driverId === selectedDriverId);
        if (!loc) return;
        map.panTo({ lat: loc.coordinates.latitude, lng: loc.coordinates.longitude });
        map.setZoom(15);
    }, [selectedDriverId, map, locations]);

    // Tüm sürücüleri kapsayacak şekilde fit bounds
    useEffect(() => {
        if (!map || locations.length === 0) return;
        if (selectedDriverId) return; // Seçili sürücü varsa fit yapma
        if (typeof google === 'undefined') return;
        const bounds = new google.maps.LatLngBounds();
        locations.forEach(loc =>
            bounds.extend({ lat: loc.coordinates.latitude, lng: loc.coordinates.longitude })
        );
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    }, [map, locations, selectedDriverId]);

    const handleMarkerClick = (location: DriverLocation) => {
        setInfoDriver(location);
        onMarkerClick?.(location);
    };

    if (!isLoaded) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Harita yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={MAP_CONTAINER}
            center={DEFAULT_CENTER}
            zoom={11}
            options={LIGHT_MAP_OPTIONS}
            onLoad={m => setMap(m)}
            onClick={() => setInfoDriver(null)}
        >
            {/* Sürücü marker'ları */}
            {locations.map(loc => (
                <DriverMarker
                    key={loc.driverId}
                    location={loc}
                    isSelected={selectedDriverId === loc.driverId || infoDriver?.driverId === loc.driverId}
                    onClick={() => handleMarkerClick(loc)}
                />
            ))}

            {/* InfoWindow */}
            {infoDriver && (
                <InfoWindow
                    position={{
                        lat: infoDriver.coordinates.latitude,
                        lng: infoDriver.coordinates.longitude,
                    }}
                    onCloseClick={() => setInfoDriver(null)}
                    options={{ pixelOffset: new google.maps.Size(0, -50) }}
                >
                    <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: '50%',
                                backgroundColor: getDriverColor(infoDriver.driver), flexShrink: 0,
                            }} />
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                                {getDriverName(infoDriver.driver)}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: '#475569' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Durum</span>
                                <span style={{
                                    fontWeight: 600,
                                    color: getDriverColor(infoDriver.driver),
                                }}>
                                    {getDriverLabel(infoDriver.driver)}
                                </span>
                            </div>
                            {infoDriver.driver.vehicle && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Araç</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                        {infoDriver.driver.vehicle.plateNumber}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Ehliyet</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                    {infoDriver.driver.licenseNumber}
                                </span>
                            </div>
                            <div style={{
                                marginTop: 6, paddingTop: 6,
                                borderTop: '1px solid #e2e8f0',
                                fontSize: 11, color: '#94a3b8',
                            }}>
                                Son güncelleme:{' '}
                                {formatDistanceToNow(new Date(infoDriver.timestamp), {
                                    addSuffix: true, locale: tr,
                                })}
                            </div>
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
