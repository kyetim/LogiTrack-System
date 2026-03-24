import * as Location from 'expo-location';
import { store } from '../store';
import { updateLocation, setError, stopTracking } from '../store/slices/locationSlice';
import { api } from './api';
import { GPS_UPDATE_INTERVAL } from '../utils/constants';

class LocationService {
    private watchSubscription: Location.LocationSubscription | null = null;
    private updateInterval: NodeJS.Timeout | null = null;
    private offlineQueue: any[] = [];

    async requestPermissions(): Promise<boolean> {
        try {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

            if (foregroundStatus !== 'granted') {
                store.dispatch(setError('Konum izni reddedildi'));
                return false;
            }

            // Request background permission
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            if (backgroundStatus !== 'granted') {
                console.warn('Background location permission not granted');
            }

            return true;
        } catch (error) {
            console.error('Permission error:', error);
            store.dispatch(setError('Konum izni alınamadı'));
            return false;
        }
    }

    async startTracking(): Promise<void> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return;

        try {
            // Watch position changes
            this.watchSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: GPS_UPDATE_INTERVAL,
                    distanceInterval: 10, // Update every 10 meters
                },
                async (location) => {
                    const { latitude, longitude } = location.coords;

                    // Update Redux state
                    store.dispatch(updateLocation({ latitude, longitude }));

                    // Send to backend
                    await this.sendLocationUpdate({
                        latitude,
                        longitude,
                        speed: location.coords.speed || undefined,
                        heading: location.coords.heading || undefined,
                    });
                }
            );

            console.log('GPS tracking started');
        } catch (error) {
            console.error('Tracking error:', error);
            store.dispatch(setError('GPS takibi başlatılamadı'));
            store.dispatch(stopTracking());
        }
    }

    async sendLocationUpdate(coords: {
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
    }): Promise<void> {
        const state = store.getState();
        const driverId = state.auth.driver?.id;

        if (!driverId) {
            console.warn('No driver ID, skipping location update');
            return;
        }

        try {
            await api.sendLocation({
                driverId,
                coordinates: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                },
                speed: coords.speed,
                heading: coords.heading,
                timestamp: new Date(),
            });

            // Send any queued offline updates
            if (this.offlineQueue.length > 0) {
                await this.syncOfflineQueue();
            }
        } catch (error) {
            console.error('Failed to send location:', error);

            // Queue for later if offline
            this.offlineQueue.push({
                driverId,
                coordinates: coords,
                timestamp: new Date(),
            });
        }
    }

    async syncOfflineQueue(): Promise<void> {
        if (this.offlineQueue.length === 0) return;

        try {
            await api.sendLocationBatch(this.offlineQueue);
            this.offlineQueue = [];
            console.log('Offline queue synced');
        } catch (error) {
            console.error('Failed to sync offline queue:', error);
        }
    }

    stopTracking(): void {
        if (this.watchSubscription) {
            this.watchSubscription.remove();
            this.watchSubscription = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        console.log('GPS tracking stopped');
    }

    async getCurrentLocation(): Promise<Location.LocationObject | null> {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            return location;
        } catch (error) {
            console.error('Get current location error:', error);
            return null;
        }
    }
}

export const locationService = new LocationService();
