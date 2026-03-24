import * as Location from 'expo-location';
import mqttService from './mqttService';
import { websocketService } from './websocket';
import { store } from '../store';
import { api } from './api';
import { offlineStorage } from './OfflineStorage';

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
                const timestamp = new Date(location.timestamp).toISOString();
                // console.log('📍 Location update:', location.coords, timestamp);

                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };

                // 1. Try to send immediate update
                try {
                    // Update Redux state so UI components like MapScreen can read it
                    store.dispatch({
                        type: 'location/updateLocation',
                        payload: coords
                    });

                    await api.updateMyLocation(coords.latitude, coords.longitude, timestamp);

                    // Real-time broadcast to admin via WebSocket
                    websocketService.emitLocation(
                        coords,
                        location.coords.speed || undefined,
                        location.coords.heading || undefined
                    );

                    store.dispatch({ type: 'location/setConnected', payload: true });
                    // console.log('✅ Location sent successfully');

                    // 2. If valid connection, try to sync ONE offline item (Piggyback sync)
                    // This creates a "drip feed" effect without complex background tasks
                    const offlineLocations = await offlineStorage.getLocations();
                    if (offlineLocations.length > 0) {
                        const oldest = offlineLocations[0];
                        console.log(`♻️ Syncing offline location: ${oldest.timestamp}`);
                        try {
                            await api.updateMyLocation(oldest.latitude, oldest.longitude, oldest.timestamp);
                            await offlineStorage.removeLocations([oldest.id]);
                        } catch (e) {
                            console.warn('Piggyback sync failed');
                        }
                    }

                } catch (error) {
                    console.warn('❌ Online update failed. Saving to offline storage.');
                    store.dispatch({ type: 'location/setConnected', payload: false });

                    // 3. Save to Offline Queue
                    await offlineStorage.saveLocation({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        timestamp: timestamp,
                        speed: location.coords.speed || undefined,
                        heading: location.coords.heading || undefined,
                    });
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
