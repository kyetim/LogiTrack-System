'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

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
        setSelectedLocation(location);
        if (onMarkerClick) {
            onMarkerClick(location);
        }
    };

    // Get marker icon based on driver status
    const getMarkerIcon = (status: string) => {
        // Check if google maps is loaded
        if (typeof google === 'undefined' || !google.maps) {
            return undefined;
        }

        const color = status === 'ON_DUTY' ? '#10b981' : '#6b7280';
        return {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
        };
    };

    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
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
                        icon={getMarkerIcon(location.driver.status)}
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
                                        className={`inline-block px-2 py-0.5 rounded text-xs ${selectedLocation.driver.status === 'ON_DUTY'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {selectedLocation.driver.status === 'ON_DUTY' ? 'Görevde' : 'Görev Dışı'}
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
        </LoadScript>
    );
}
