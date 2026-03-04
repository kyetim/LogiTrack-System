'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

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
        isAvailable: boolean;
        isAvailableForWork: boolean;
        licenseNumber: string;
        user: {
            email: string;
        };
        vehicle?: {
            plateNumber: string;
        };
    };
}

interface TrackingMapProps {
    locations: DriverLocation[];
    onMarkerClick?: (location: DriverLocation) => void;
}

const mapContainerStyle = {
    width: '100%',
    height: '600px',
};

// Istanbul center
const defaultCenter = {
    lat: 41.0082,
    lng: 28.9784,
};

export function TrackingMap({ locations, onMarkerClick }: TrackingMapProps) {
    const [selectedLocation, setSelectedLocation] = useState<DriverLocation | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    // Hardcoded key for debugging environment issues (same as LiveDriverMap)
    const googleMapsApiKey = 'AIzaSyAdETeNnMfcZb1TXScSvqJkRIoQW7ufVcU';

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: googleMapsApiKey
    });

    // Auto-fit bounds when locations change
    useEffect(() => {
        if (map && locations.length > 0 && typeof google !== 'undefined' && google.maps) {
            const bounds = new google.maps.LatLngBounds();
            locations.forEach((loc) => {
                bounds.extend({
                    lat: loc.coordinates.latitude,
                    lng: loc.coordinates.longitude,
                });
            });
            map.fitBounds(bounds);
        }
    }, [map, locations]);

    const handleMarkerClick = (location: DriverLocation) => {
        // ... same impl
        setSelectedLocation(location);
        if (onMarkerClick) {
            onMarkerClick(location);
        }
    };

    // Get marker icon based on driver status
    const getMarkerIcon = (driver: DriverLocation['driver']) => {
        // ... same impl
        // Check if google maps is loaded
        if (typeof google === 'undefined' || !google.maps || !google.maps.SymbolPath) {
            return undefined;
        }

        let color = '#6b7280'; // Gray (OFF_DUTY)

        if (driver.status === 'ON_DUTY') {
            color = driver.isAvailable ? '#10b981' : '#3b82f6'; // Green (Available) vs Blue (Busy)
        }

        return {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
        };
    };

    if (!isLoaded) {
        return <div className="h-[600px] w-full bg-gray-100 flex items-center justify-center">Harita Yükleniyor...</div>;
    }

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={11}
            onLoad={(map) => setMap(map)}
            options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
            }}
        >
            {locations.map((location) => (
                <Marker
                    key={location.id}
                    position={{
                        lat: location.coordinates.latitude,
                        lng: location.coordinates.longitude,
                    }}
                    icon={getMarkerIcon(location.driver)}
                    onClick={() => handleMarkerClick(location)}
                    title={location.driver.user.email}
                />
            ))}

            {selectedLocation && (
                <InfoWindow
                    position={{
                        lat: selectedLocation.coordinates.latitude,
                        lng: selectedLocation.coordinates.longitude,
                    }}
                    onCloseClick={() => setSelectedLocation(null)}
                >
                    <div className="p-2">
                        <h3 className="font-semibold text-gray-900">
                            {selectedLocation.driver.user.email}
                        </h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>
                                <span className="font-medium">Durum:</span>{' '}
                                <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs text-white ${selectedLocation.driver.status === 'ON_DUTY'
                                        ? (selectedLocation.driver.isAvailable ? 'bg-green-500' : 'bg-blue-500')
                                        : 'bg-gray-500'
                                        }`}
                                >
                                    {selectedLocation.driver.status === 'ON_DUTY'
                                        ? (selectedLocation.driver.isAvailable ? 'Müsait' : 'Görevde')
                                        : 'Görev Dışı'}
                                </span>
                            </p>
                            <p>
                                <span className="font-medium">Ehliyet:</span> {selectedLocation.driver.licenseNumber}
                            </p>
                            {selectedLocation.driver.vehicle && (
                                <p>
                                    <span className="font-medium">Araç:</span>{' '}
                                    {selectedLocation.driver.vehicle.plateNumber}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Son güncelleme: {new Date(selectedLocation.timestamp).toLocaleString('tr-TR')}
                            </p>
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
