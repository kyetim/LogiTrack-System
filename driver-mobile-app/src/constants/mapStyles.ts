import { MapStyleElement } from 'react-native-maps';

export const DARK_MAP_STYLE: MapStyleElement[] = [
    // Arkaplan + su alanları
    { elementType: 'geometry', stylers: [{ color: '#0D0D0D' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8A8A8A' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0D0D' }] },
    // Yollar
    {
        featureType: 'road', elementType: 'geometry',
        stylers: [{ color: '#1A1A1A' }]
    },
    {
        featureType: 'road.arterial', elementType: 'geometry',
        stylers: [{ color: '#242424' }]
    },
    {
        featureType: 'road.highway', elementType: 'geometry',
        stylers: [{ color: '#2A2A2A' }]
    },
    {
        featureType: 'road.highway', elementType: 'geometry.stroke',
        stylers: [{ color: '#1A1A1A' }]
    },
    // POI tamamen gizle
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    // Su
    {
        featureType: 'water', elementType: 'geometry',
        stylers: [{ color: '#0A0A0A' }]
    },
    // İdari sınırlar
    {
        featureType: 'administrative', elementType: 'geometry.stroke',
        stylers: [{ color: '#2A2A2A' }]
    },
];

export const LIGHT_MAP_STYLE: MapStyleElement[] = [];
// Boş dizi = Google Maps'in varsayılan standard stili
// Dark mode eklendiğinde DARK_MAP_STYLE otomatik devreye girer

export const MAP_INITIAL_REGION = {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

// Mock koordinatlar (gerçek routing hazır olana kadar)
export const MOCK_PICKUP_COORD = { latitude: 40.9917, longitude: 29.0255 };
export const MOCK_DELIVERY_COORD = { latitude: 41.0082, longitude: 28.9784 };
export const MOCK_ROUTE_COORDS = [
    { latitude: 40.9917, longitude: 29.0255 },
    { latitude: 40.9967, longitude: 29.0155 },
    { latitude: 41.0017, longitude: 28.9985 },
    { latitude: 41.0082, longitude: 28.9784 },
];
export const MOCK_JOB_COORDS = [
    { latitude: 41.0150, longitude: 28.9650 },
    { latitude: 40.9850, longitude: 29.0100 },
    { latitude: 41.0050, longitude: 28.9900 },
];
