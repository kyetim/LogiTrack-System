// User & Auth Types
export interface User {
    id: string;
    email: string;
    role: 'DRIVER' | 'ADMIN' | 'DISPATCHER';
}

export interface Driver {
    id: string;
    userId: string;
    licenseNumber: string;
    phoneNumber: string;
    status: 'ON_DUTY' | 'OFF_DUTY';
    user: User;
    vehicle?: Vehicle;
}

export interface Vehicle {
    id: string;
    plateNumber: string;
    type: string;
    capacity: number;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
}

// Shipment Types
export interface Shipment {
    id: string;
    trackingNumber: string;
    status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    origin: string;
    destination: string;
    pickupLocation?: any; // JSON object with lat, lng, address
    deliveryLocation?: any; // JSON object with lat, lng, address
    driverId?: string;
    driver?: Driver;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    sequence?: number; // Optimized delivery order (1, 2, 3...)
    createdAt: string;
    updatedAt: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

// Location Types
export interface LocationUpdate {
    driverId: string;
    coordinates: Coordinates;
    speed?: number;
    heading?: number;
    timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

// Redux State Types
export interface AuthState {
    user: User | null;
    driver: Driver | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

export interface ShipmentsState {
    shipments: Shipment[];
    currentShipment: Shipment | null;
    isLoading: boolean;
    error: string | null;
    lastSync: Date | null;
}

export interface LocationState {
    isTracking: boolean;
    currentLocation: Coordinates | null;
    error: string | null;
    lastUpdate: Date | null;
    isConnected: boolean;
    locationHistory: Coordinates[];
}

export interface MapState {
    selectedShipmentId: string | null;
    mapRegion: any | null;
    showUserLocation: boolean;
}

export interface ConfigState {
    mqttEnabled: boolean;
}

export interface RootState {
    auth: AuthState;
    shipments: ShipmentsState;
    location: LocationState;
    map: MapState;
    config: ConfigState;
}
