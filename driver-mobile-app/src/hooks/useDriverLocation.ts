import { useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { startLocationTracking, stopLocationTracking } from '../../services/locationTracking';
import mqttService from '../../services/mqttService';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && locations.length > 0) {
            const latestLocation = locations[0];
            // Forward background location to connected MQTT
            mqttService.sendLocation({
                latitude: latestLocation.coords.latitude,
                longitude: latestLocation.coords.longitude
            }, latestLocation.coords.speed || undefined, latestLocation.coords.heading || undefined);
        }
    }
});

export const useDriverLocation = () => {
    const [backgroundPermissionGranted, setBackgroundPermissionGranted] = useState(false);

    const startTracking = async () => {
        // Start foreground legacy tracking
        const success = await startLocationTracking();
        if (!success) return;

        // Try to start background tracking
        try {
            const { granted } = await Location.requestBackgroundPermissionsAsync();
            setBackgroundPermissionGranted(granted);

            if (granted) {
                await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 10000,
                    distanceInterval: 50,
                    foregroundService: {
                        notificationTitle: 'LogiTrack Aktif',
                        notificationBody: 'Konum takibi arka planda çalışıyor',
                        notificationColor: '#FFD700',
                    },
                });
                console.log('✅ Background tracking activated');
            } else {
                console.warn('⚠️ Background permission denied, falling back to foreground only');
            }
        } catch (err) {
            console.error('Failed to start background tracking:', err);
        }
    };

    const stopTracking = async () => {
        // Stop foreground tracking
        await stopLocationTracking();

        // Stop background task
        try {
            const isTaskDefined = await TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
            const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

            if (isTaskDefined && isTaskRegistered) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
                console.log('✅ Background tracking stopped');
            }
        } catch (error) {
            console.error('Failed to stop background tracking:', error);
        }
    };

    return {
        backgroundPermissionGranted,
        startTracking,
        stopTracking
    };
};
