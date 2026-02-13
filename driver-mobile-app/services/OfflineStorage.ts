import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineLocation {
    id: string; // UUID or timestamp
    latitude: number;
    longitude: number;
    timestamp: string; // ISO string
    speed?: number;
    heading?: number;
}

const STORAGE_KEY = '@offline_locations_queue';

class OfflineStorageService {
    /**
     * Save a location to the offline queue
     */
    async saveLocation(location: Omit<OfflineLocation, 'id'>): Promise<void> {
        try {
            const existing = await this.getLocations();
            const newLocation: OfflineLocation = {
                ...location,
                id: Date.now().toString(), // Simple unique ID
            };

            // Limit queue size to avoid memory issues (e.g., 1000 items)
            if (existing.length >= 1000) {
                // Remove oldest
                existing.shift();
            }

            existing.push(newLocation);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
            console.log(`[OfflineStorage] Saved location. Queue size: ${existing.length}`);
        } catch (error) {
            console.error('[OfflineStorage] Failed to save location:', error);
        }
    }

    /**
     * Get all queued locations
     */
    async getLocations(): Promise<OfflineLocation[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch (error) {
            console.error('[OfflineStorage] Failed to get locations:', error);
            return [];
        }
    }

    /**
     * Remove specific locations from the queue (after successful sync)
     */
    async removeLocations(ids: string[]): Promise<void> {
        try {
            const existing = await this.getLocations();
            const filtered = existing.filter(loc => !ids.includes(loc.id));
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('[OfflineStorage] Failed to remove locations:', error);
        }
    }

    /**
     * Clear all offline data
     */
    async clearQueue(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('[OfflineStorage] Failed to clear queue:', error);
        }
    }

    /**
     * Get queue size
     */
    async getQueueSize(): Promise<number> {
        try {
            const locations = await this.getLocations();
            return locations.length;
        } catch {
            return 0;
        }
    }
}

export const offlineStorage = new OfflineStorageService();
