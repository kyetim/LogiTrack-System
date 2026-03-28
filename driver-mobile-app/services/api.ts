import axios, { AxiosInstance, AxiosError } from 'axios';
import secureStorage from '@/services/secureStorage';
import axiosRetry from 'axios-retry';
import { API_URL, STORAGE_KEYS } from '../utils/constants';
import { AuthResponse, ApiResponse, Shipment, LocationUpdate, Driver } from '../types';
import { store } from '../store';
import { clearAuth } from '../store/slices/authSlice';

class ApiClient {
    private client: AxiosInstance;
    private isLoggingOut = false;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        axiosRetry(this.client, {
            retries: 2,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) =>
                !!axiosRetry.isNetworkError(error) &&
                error.response?.status !== 401 &&
                error.response?.status !== 403,
        });

        // Request interceptor - Add auth token
        this.client.interceptors.request.use(
            async (config) => {
                const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
                const requestUrl = (error.config as any)?.url ?? '';
                // Skip auth-clear for login/register endpoints — they return 401
                // legitimately (wrong password) and must NOT clear the store
                const isAuthEndpoint =
                    requestUrl.includes('/auth/login') ||
                    requestUrl.includes('/auth/register');

                if (error.response?.status === 401 && !this.isLoggingOut && !isAuthEndpoint) {
                    this.isLoggingOut = true;
                    // Token expired - clear storage
                    await secureStorage.multiRemove([
                        STORAGE_KEYS.AUTH_TOKEN,
                        STORAGE_KEYS.USER_DATA,
                        STORAGE_KEYS.DRIVER,
                    ]);
                    // Clear Redux state
                    store.dispatch(clearAuth());

                    setTimeout(() => { this.isLoggingOut = false; }, 3000);
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth
    async login(email: string, password: string): Promise<AuthResponse> {
        console.log('📡 [API] POST /auth/login cagiriliyor...', email);
        try {
            const { data } = await this.client.post<AuthResponse>('/auth/login', {
                email,
                password,
            });
            console.log('✅ [API] POST /auth/login basarili');
            return data;
        } catch (error: any) {
            console.log('❌ [API] POST /auth/login hata firlatti:', error.message);
            throw error;
        }
    }

    async registerDriver(payload: any): Promise<void> {
        await this.client.post('/auth/register-driver', payload);
    }

    async forgotPassword(email: string): Promise<void> {
        await this.client.post('/auth/forgot-password', { email });
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        await this.client.post('/auth/reset-password', { token, newPassword });
    }

    async logout(): Promise<void> {
        await this.client.post('/auth/logout');
    }

    // Driver
    async getMyProfile(): Promise<Driver> {
        const { data } = await this.client.get<Driver>('/drivers/me');
        return data;
    }

    async registerPushToken(token: string): Promise<void> {
        await this.client.post('/notifications/token', { token });
    }

    async getAdmins(): Promise<AuthResponse['user'][]> {
        const { data } = await this.client.get<AuthResponse['user'][]>('/users/admins');
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

    async uploadPhotoMultipart(uri: string): Promise<string> {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
            uri,
            name: filename,
            type: fileType,
        } as any);

        const { data } = await this.client.post<{ url: string }>('/upload/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.url;
    }

    async uploadSignatureBase64(uri: string): Promise<string> {
        const { data } = await this.client.post<{ url: string }>('/upload/signature-base64', {
            image: uri, // Usually Base64 but we have a URI, so Backend needs to handle this or App needs to readAsString
        });
        return data.url;
    }

    async submitDeliveryProof(id: string, payload: {
        photoUrl?: string;
        signatureUrl?: string;
        recipientName?: string;
        notes?: string;
    }): Promise<void> {
        await this.client.post(`/shipments/${id}/delivery-proof`, payload);
    }

    // Location
    async sendLocation(location: LocationUpdate): Promise<void> {
        await this.client.post('/locations', location);
    }

    async sendLocationBatch(locations: LocationUpdate[]): Promise<void> {
        await this.client.post('/locations/batch', { locations });
    }

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

    // Support Tickets
    async getMyTicket(): Promise<any> {
        const { data } = await this.client.get('/support/my-ticket');
        return data;
    }

    async sendSupportMessage(content: string, priority?: string): Promise<any> {
        const { data } = await this.client.post('/support/my-ticket/messages', {
            content,
            ...(priority && { priority }),
        });
        return data;
    }

    async closeMyTicket(): Promise<any> {
        const { data } = await this.client.patch('/support/my-ticket/close');
        return data;
    }

    async createEmergencyTicket(location?: string): Promise<any> {
        const { data } = await this.client.post('/support/emergency', { location });
        return data;
    }

    async getMyClosedTickets(): Promise<any[]> {
        const { data } = await this.client.get('/support/my-ticket/history');
        return data;
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
        const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        // file-upload is excluded from /api prefix on backend
        const baseUrl = API_URL.replace('/api', '');
        const response = await fetch(`${baseUrl}/file-upload/document`, {
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
        const isGoingOnline = status !== 'OFF_DUTY';
        // Update the isAvailableForWork flag so the admin map marker shows correctly
        await this.client.post('/drivers/me/availability-for-work', { isAvailable: isGoingOnline });
        // Also return data for slice usage
        return { status, isAvailable: isGoingOnline };
    }

    async getAvailabilitySummary(): Promise<any> {
        const { data } = await this.client.get('/drivers/availability/summary');
        return data;
    }

    async getAvailableDrivers(): Promise<any> {
        const { data } = await this.client.get('/drivers/availability/available');
        return data;
    }

    // Smart Job Matching (NEW)
    async getNearbyShipments(radius?: number): Promise<Shipment[]> {
        const { data } = await this.client.get<Shipment[]>('/shipments/nearby', {
            params: { radius: radius || 50 },
        });
        return data;
    }

    async updateMyLocation(lat: number, lng: number, timestamp?: string): Promise<void> {
        await this.client.post('/drivers/me/location', {
            lat,
            lng,
            timestamp,
        });
    }

    async setAvailabilityForWork(isAvailable: boolean): Promise<any> {
        const { data } = await this.client.post('/drivers/me/availability-for-work', {
            isAvailable,
        });
        return data;
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await this.client.patch('/auth/change-password', { currentPassword, newPassword });
    }

    async deleteAccount(): Promise<void> {
        await this.client.delete('/users/me');
    }

    // ==================== END NEW ENDPOINTS ====================
}

export const api = new ApiClient();

