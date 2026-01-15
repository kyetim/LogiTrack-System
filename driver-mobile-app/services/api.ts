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
        const { data } = await this.client.get<Shipment[]>('/shipments/my-shipments');
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
}

export const api = new ApiClient();
