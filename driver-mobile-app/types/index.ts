// User & Auth Types
export interface User {
    id: string;
    email: string;
    role: 'DRIVER' | 'ADMIN' | 'DISPATCHER';
    firstName?: string;
    lastName?: string;
}

export interface Driver {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    licenseNumber: string;
    phoneNumber: string;
    profileImage?: string;
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
    pickupLocation: {
        lat: number;
        lng: number;
        address: string;
    };
    deliveryLocation: {
        lat: number;
        lng: number;
        address: string;
    };
    driverId?: string;
    driver?: Driver;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    waybillUrl?: string; // Uploaded waybill URL
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

// ==================== NEW TYPES ====================

// Messaging Types
export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    read: boolean;
    createdAt: string;
    sender?: User;
    recipient?: User;
}

export interface Conversation {
    user: User;
    lastMessage: Message;
    unreadCount: number;
}

// Scoring Types
export interface DriverScore {
    driverId: string;
    overallScore: number; // 0-100
    safetyScore: number;
    punctualityScore: number;
    fuelEfficiency: number;
    customerRating: number;
    rank?: number;
    updatedAt: string;
}

export interface LeaderboardEntry {
    driver: Driver;
    score: DriverScore;
    rank: number;
}

// Document Types
export interface Document {
    id: string;
    entityType: 'USER' | 'DRIVER' | 'VEHICLE' | 'COMPANY';
    entityId: string;
    documentType: string; // 'LICENSE', 'INSURANCE', 'REGISTRATION', etc.
    fileUrl: string;
    fileName: string;
    displayName?: string;  // User-friendly title
    fileSize: number;
    mimeType: string;
    expiryDate?: string;
    verified: boolean;
    verifiedBy?: string;
    uploadedAt: string;
}

export interface UploadDocumentRequest {
    entityType: 'USER' | 'DRIVER' | 'VEHICLE' | 'COMPANY';
    entityId: string;
    documentType: string;
    expiryDate?: string;
}

// Geofencing Types
export interface Geofence {
    id: string;
    name: string;
    type: 'WAREHOUSE' | 'CUSTOMER_LOCATION' | 'RESTRICTED_AREA' | 'PREFERRED_ZONE';
    center: {
        lat: number;
        lng: number;
    };
    radius: number; // in meters
    active: boolean;
    createdAt: string;
}

export interface GeofenceEvent {
    id: string;
    geofenceId: string;
    driverId: string;
    eventType: 'ENTER' | 'EXIT';
    location: {
        lat: number;
        lng: number;
    };
    timestamp: string;
    geofence?: Geofence;
}

export interface GeofenceCheckResult {
    inside: boolean;
    geofences: Geofence[];
    distance?: number; // distance to nearest geofence
}

// Driver Availability Types
export type AvailabilityStatus = 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY';

export interface AvailabilitySummary {
    driverId: string;
    status: AvailabilityStatus;
    lastUpdated: string;
    capacity?: number;
    currentLoad?: number;
}

// ==================== OFFLINE-FIRST TYPES ====================

/** Offline kuyruğuna alınan bir şoför eyleminin tip-güvenli tanımı */
export type PendingActionType =
    | 'UPDATE_SHIPMENT_STATUS'
    | 'COMPLETE_DELIVERY';

export interface PendingAction {
    /** Kuyruktaki eylemin benzersiz ID'si (UUID) */
    id: string;
    type: PendingActionType;
    /** Eyleme özgü veri (shipmentId, status vb.) */
    payload: Record<string, unknown>;
    createdAt: string; // ISO string
    retryCount: number;
}

// ==================== END NEW TYPES ====================

//API Response Types
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
    /** Çevrimdışıyken kuyruğa alınan eylemler */
    pendingActions: PendingAction[];
    /** Ağ bağlantısı durumu */
    isOffline: boolean;
}

export interface LocationState {
    isTracking: boolean;
    currentLocation: Coordinates | null;
    error: string | null;
    lastUpdate: string | null;
    isConnected: boolean;
    locationHistory: Coordinates[];
}

/** react-native-maps Region şeklini yansıtır (dış bağımlılık olmadan) */
export interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export interface MapState {
    selectedShipmentId: string | null;
    mapRegion: MapRegion | null;
    showUserLocation: boolean;
}

export interface ConfigState {
    mqttEnabled: boolean;
}

// ==================== NEW STATE TYPES ====================

export interface MessagesState {
    conversations: Conversation[];
    currentMessages: Message[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

export interface LeaderboardEntry {
    rank: number;
    driverId: string;
    driver: Driver;
    score: DriverScore;
}

export interface ScoringState {
    leaderboard: LeaderboardEntry[];
    myScore: DriverScore | null;
    isLoading: boolean;
    error: string | null;
}

export interface DocumentsState {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
}

export interface GeofencingState {
    geofences: Geofence[];
    events: GeofenceEvent[];
    currentCheck: GeofenceCheckResult | null;
    isLoading: boolean;
    error: string | null;
}

export interface AvailabilityState {
    status: AvailabilityStatus;
    isUpdating: boolean;
    error: string | null;
}

export interface SupportState {
    currentTicket: SupportTicket | null;
    messages: SupportMessage[];
    isLoading: boolean;
    isSending: boolean;
    error: string | null;
}

// ==================== Support Ticket Types ====================

export interface SupportMessage {
    id: string;
    ticketId: string;
    senderId: string;
    sender: {
        id: string;
        email: string;
        role: string;
    };
    senderRole?: 'DRIVER' | 'ADMIN' | 'DISPATCHER';
    content: string;
    isInternal: boolean;
    isSystemMessage: boolean;
    attachments?: string[];
    createdAt: string;
}

export interface SupportTicket {
    id: string;
    ticketNumber: string;
    driverId: string;
    subject: string;
    status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    messages: SupportMessage[];
    createdAt: string;
    updatedAt: string;
}

// ==================== END NEW STATE TYPES ====================

export interface RootState {
    auth: AuthState;
    shipments: ShipmentsState;
    location: LocationState;
    map: MapState;
    config: ConfigState;
    messages: MessagesState; // NEW
    scoring: ScoringState; // NEW
    documents: DocumentsState; // NEW
    geofencing: GeofencingState; // NEW
    availability: AvailabilityState;
    support: SupportState;
}
