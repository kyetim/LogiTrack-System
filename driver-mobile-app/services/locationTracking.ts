import * as Location from 'expo-location';
import mqttService from './mqttService';
import { store } from '../store';
import { api } from './api';

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

        // MQTT disabled due to Windows Firewall issues - using HTTP fallback
        // Connect to MQTT
        // console.log('🚀 Using MQTT protocol');
        // const connected = await mqttService.connect();

        // if (connected) {
        //     store.dispatch({ type: 'location/setConnected', payload: true });
        // } else {
        //     console.warn('MQTT connection failed - will use offline queue');
        //     // Don't fail, offline queue will handle it
        //     // But we can mark as not connected for UI
        store.dispatch({ type: 'location/setConnected', payload: false });
        // }

        console.log('⚠️ Using foreground-only tracking (Expo Go limitation)');

        // Use watchPositionAsync instead of background task
        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 30000, // 30 seconds
                distanceInterval: 50, // 50 meters
            },
            async (location) => {
                console.log('📍 Location update:', location.coords);

                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                const speed = location.coords.speed || undefined;
                const heading = location.coords.heading || undefined;

                // Send via HTTP API (MQTT disabled due to connection issues)
                console.log('📡 Sending location via HTTP API');
                try {
                    await api.updateMyLocation(coords.latitude, coords.longitude);
                    store.dispatch({ type: 'location/setConnected', payload: true });
                    console.log('✅ Location sent successfully');
                } catch (error) {
                    console.warn('HTTP location update failed:', error);
                    store.dispatch({ type: 'location/setConnected', payload: false });
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

        // Disconnect MQTT
        mqttService.disconnect();

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
