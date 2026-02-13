import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { formatDistanceToNow } from 'date-fns';

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

interface LiveDriverMapProps {
    drivers: Driver[];
}

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem'
};

const defaultCenter = {
    lat: 36.8,
    lng: 34.6
};

const LiveDriverMap = ({ drivers }: LiveDriverMapProps) => {
    // Hardcoded key for debugging environment issues
    const googleMapsApiKey = 'AIzaSyAdETeNnMfcZb1TXScSvqJkRIoQW7ufVcU';
    console.log('🔑 Google Maps Key (Hardcoded):', googleMapsApiKey);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: googleMapsApiKey
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    // Custom marker icons based on status
    const getMarkerIcon = (driver: Driver) => {
        let color = 'gray'; // OFF_DUTY or unknown
        if (driver.status === 'AVAILABLE' && driver.isAvailableForWork) color = 'green';
        else if (driver.status === 'ON_DUTY') color = 'blue';

        // Use Google Maps standard colored markers
        return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
    };

    if (!isLoaded) {
        return <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">Loading Google Maps...</div>;
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={drivers.length > 0 && drivers[0].locationCoordinates ? {
                lat: drivers[0].locationCoordinates.latitude,
                lng: drivers[0].locationCoordinates.longitude
            } : defaultCenter}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
        >
            {drivers.map((driver) => {
                if (!driver.locationCoordinates) return null;

                return (
                    <Marker
                        key={driver.id}
                        position={{
                            lat: driver.locationCoordinates.latitude,
                            lng: driver.locationCoordinates.longitude
                        }}
                        icon={getMarkerIcon(driver)}
                        onClick={() => setSelectedDriver(driver)}
                    />
                );
            })}

            {selectedDriver && selectedDriver.locationCoordinates && (
                <InfoWindow
                    position={{
                        lat: selectedDriver.locationCoordinates.latitude,
                        lng: selectedDriver.locationCoordinates.longitude
                    }}
                    onCloseClick={() => setSelectedDriver(null)}
                >
                    <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-lg mb-1 text-black">
                            {selectedDriver.user.firstName} {selectedDriver.user.lastName}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-800">
                            <p>
                                <span className="font-semibold">Status:</span>
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs text-white ${selectedDriver.status === 'AVAILABLE' ? 'bg-green-500' :
                                    selectedDriver.status === 'ON_DUTY' ? 'bg-blue-500' : 'bg-gray-500'
                                    }`}>
                                    {selectedDriver.status}
                                </span>
                            </p>
                            <p>
                                <span className="font-semibold">Available:</span>
                                <span className="ml-1">
                                    {selectedDriver.isAvailableForWork ? '✅ Yes' : '❌ No'}
                                </span>
                            </p>
                            <p className="text-gray-500 text-xs mt-2">
                                Last updated: {selectedDriver.lastLocationUpdate ? formatDistanceToNow(new Date(selectedDriver.lastLocationUpdate), { addSuffix: true }) : 'Never'}
                            </p>
                            {selectedDriver.user.phone && (
                                <a href={`tel:${selectedDriver.user.phone}`} className="block mt-2 text-blue-600 hover:underline">
                                    📞 {selectedDriver.user.phone}
                                </a>
                            )}
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export default LiveDriverMap;
