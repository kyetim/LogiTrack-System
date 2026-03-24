export type DeliveryStatus = 'active' | 'completed' | 'pending' | 'cancelled' | 'online' | 'offline' | 'delivering';
export type PackageType = 'standard' | 'fragile' | 'heavy' | 'document';

export interface Driver {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    avatarInitials: string;
    rating: number;
    totalDeliveries: number;
    joinDate: string;
    vehicleType: string;
    vehiclePlate: string;
    isOnline: boolean;
}

export interface TodayStats {
    earnings: number;
    deliveries: number;
    hoursOnline: number;
    rating: number;
    earningsTrend: string;
    deliveriesTrend: string;
}

export interface Delivery {
    id: string;
    customerName: string;
    customerPhone?: string;
    pickupAddress: string;
    deliveryAddress: string;
    distance: string;
    estimatedTime: string;
    price: string;
    status: DeliveryStatus;
    packageType: PackageType;
    date?: string;       // Used for history
    progress?: number;   // Used for active delivery
    pickupTime?: string; // Used for active delivery
    notes?: string;      // Used for active delivery
}

export interface AvailableJob {
    id: string;
    customerName: string;
    pickupAddress: string;
    deliveryAddress: string;
    distance: string;
    estimatedTime: string;
    price: string;
    packageType: PackageType;
    postedTime: string;
    pickupDistance: string;
    expiresIn: number;
}

export interface IssueCategory {
    id: string;
    label: string;
    icon: string;
}

export interface EarningDay {
    day: string;
    earnings: number;
    deliveries: number;
}

export interface EarningsHistory {
    thisWeek: { total: number; days: EarningDay[] };
    lastWeek: { total: number; days: EarningDay[] };
    bonuses: { label: string; amount: number }[];
}

export interface ChatMessage {
    id: string;
    sender: 'support' | 'driver';
    text: string;
    time: string;
}
