import * as Location from 'expo-location';
import websocketService from './websocket';

let locationSubscription: Location.LocationSubscription | null = null;

export const startLocationTracking = async (): Promise<boolean> => {
    try {
        // Stop existing subscription if any
        if (locationSubscription) {
            console.log('Location tracking already started');
            return true;
        }

        // Request foreground location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Foreground location permission not granted');
            return false;
        }

        console.log('⚠️ Using foreground-only tracking (Expo Go limitation)');

        // Use watchPositionAsync instead of background task
        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 30000, // 30 seconds
                distanceInterval: 50, // 50 meters
            },
            (location) => {
                console.log('📍 Location update:', location.coords);

                // Send to backend via WebSocket
                const success = websocketService.sendLocation(
                    {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                    location.coords.speed || undefined,
                    location.coords.heading || undefined
                );

                if (!success) {
                    console.warn('Failed to send location, WebSocket not connected');
                }
            }
        );

        console.log('✅ Location tracking started (foreground only)');
        return true;
    } catch (error) {
        console.error('Failed to start location tracking:', error);
        return false;
    }
};

export const stopLocationTracking = async (): Promise<boolean> => {
    try {
        if (!locationSubscription) {
            console.log('Location tracking not started');
            return true;
        }

        locationSubscription.remove();
        locationSubscription = null;
        console.log('✅ Location tracking stopped');
        return true;
    } catch (error) {
        console.error('Failed to stop location tracking:', error);
        return false;
    }
};

export const isLocationTrackingActive = async (): Promise<boolean> => {
    return locationSubscription !== null;
};
