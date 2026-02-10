import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../utils/constants';
import { AuthResponse, ApiResponse, Shipment, LocationUpdate, Driver } from '../types';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor - Add auth token
        this.client.interceptors.request.use(
            async (config) => {
                const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - Handle errors
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expired - clear storage
                    await AsyncStorage.multiRemove([
                        STORAGE_KEYS.AUTH_TOKEN,
                        STORAGE_KEYS.USER_DATA,
                    ]);
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth
    async login(email: string, password: string): Promise<AuthResponse> {
        const { data } = await this.client.post<AuthResponse>('/auth/login', {
            email,
            password,
        });
        return data;
    }

    async logout(): Promise<void> {
        await this.client.post('/auth/logout');
    }

    // Driver
    async getMyProfile(): Promise<Driver> {
        const { data } = await this.client.get<Driver>('/drivers/me');
        return data;
    }

    // Shipments
    async getMyShipments(): Promise<Shipment[]> {
        const { data } = await this.client.get<Shipment[]>('/shipments/my');
        return data;
    }

    async getShipment(id: string): Promise<Shipment> {
        const { data } = await this.client.get<Shipment>(`/shipments/${id}`);
        return data;
    }

    async updateShipmentStatus(
        id: string,
        status: Shipment['status']
    ): Promise<Shipment> {
        const { data } = await this.client.patch<Shipment>(
            `/shipments/${id}/status`,
            { status }
        );
        return data;
    }

    async uploadShipmentPhoto(id: string, photo: FormData): Promise<void> {
        await this.client.post(`/shipments/${id}/photos`, photo, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    // Location
    async sendLocation(location: LocationUpdate): Promise<void> {
        await this.client.post('/locations', location);
    }

    async sendLocationBatch(locations: LocationUpdate[]): Promise<void> {
        await this.client.post('/locations/batch', { locations });
    }

    // Notifications
    async registerPushToken(token: string): Promise<void> {
        await this.client.post('/notifications/token', { token });
    }

    // ==================== NEW ENDPOINTS ====================

    // Messaging
    async getConversations(): Promise<any> {
        const { data } = await this.client.get('/messages/conversations');
        return data;
    }

    async getMessages(userId: string): Promise<any> {
        const { data } = await this.client.get(`/messages/conversation/${userId}`);
        return data;
    }

    async sendMessage(recipientId: string, content: string): Promise<any> {
        const { data } = await this.client.post('/messages', {
            recipientId,
            content,
        });
        return data;
    }

    async markMessageAsRead(messageId: string): Promise<void> {
        await this.client.patch(`/messages/${messageId}/read`);
    }

    async markConversationAsRead(userId: string): Promise<void> {
        await this.client.patch(`/messages/conversation/${userId}/read`);
    }

    async getUnreadCount(): Promise<number> {
        const { data } = await this.client.get('/messages/unread-count');
        return data.count || 0;
    }

    // Scoring
    async getLeaderboard(limit: number = 10): Promise<any> {
        const { data } = await this.client.get('/scoring/leaderboard', {
            params: { limit },
        });
        return data;
    }

    async getMyScore(): Promise<any> {
        const { data } = await this.client.get('/scoring/drivers/me');
        return data;
    }

    async getScoringStatistics(): Promise<any> {
        const { data } = await this.client.get('/scoring/statistics');
        return data;
    }

    // Documents
    async getMyDocuments(): Promise<any> {
        const { data } = await this.client.get('/documents/my');
        return data;
    }

    async uploadDocumentV2(file: FormData): Promise<any> {
        console.log('🚀 API: uploadDocumentV2 (FETCH) called');
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const response = await fetch(`${API_URL}/file-upload/document`, {
            method: 'POST',
            body: file as any,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }
        return data;
    }

    async createDocumentRecord(documentData: any): Promise<any> {
        const { data } = await this.client.post('/documents/upload', documentData);
        return data;
    }

    async getExpiringDocuments(days: number = 30): Promise<any> {
        const { data } = await this.client.get('/documents/expiring', {
            params: { days },
        });
        return data;
    }

    async deleteDocument(id: string): Promise<void> {
        await this.client.delete(`/documents/${id}`);
    }

    // Geofencing
    async getGeofences(): Promise<any> {
        const { data } = await this.client.get('/geofencing/geofences');
        return data;
    }

    async checkLocation(lat: number, lng: number): Promise<any> {
        const { data } = await this.client.post('/geofencing/check', {
            latitude: lat,
            longitude: lng,
        });
        return data;
    }

    async getGeofenceEvents(limit: number = 50): Promise<any> {
        const { data } = await this.client.get('/geofencing/events', {
            params: { limit },
        });
        return data;
    }

    async getGeofenceStatistics(geofenceId: string): Promise<any> {
        const { data } = await this.client.get(`/geofencing/geofences/${geofenceId}/statistics`);
        return data;
    }

    // Driver Availability
    async updateAvailability(status: 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY'): Promise<any> {
        const { data } = await this.client.patch('/drivers/me/availability', {
            status,
        });
        return data;
    }

    async getAvailabilitySummary(): Promise<any> {
        const { data } = await this.client.get('/drivers/availability/summary');
        return data;
    }

    async getAvailableDrivers(): Promise<any> {
        const { data } = await this.client.get('/drivers/availability/available');
        return data;
    }

    // ==================== END NEW ENDPOINTS ====================
}

export const api = new ApiClient();

