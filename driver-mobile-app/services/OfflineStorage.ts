import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { PendingAction, PendingActionType } from '../types';

// ============================================================
// GPS Location Queue (Mevcut — Dokunulmadı)
// ============================================================

export interface OfflineLocation {
    id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
}

const LOCATION_STORAGE_KEY = STORAGE_KEYS.OFFLINE_QUEUE;
const MAX_LOCATION_QUEUE = 1000;

// ============================================================
// Pending Actions Queue (Yeni — Offline-First Eylemler)
// ============================================================

const PENDING_KEY = STORAGE_KEYS.PENDING_ACTIONS_QUEUE;
const MAX_RETRY_COUNT = 3;

class OfflineStorageService {
    // -----------------------------------------------------------
    // GPS Location Queue Methods
    // -----------------------------------------------------------

    /** GPS konumunu offline kuyruğuna kaydet */
    async saveLocation(location: Omit<OfflineLocation, 'id'>): Promise<void> {
        try {
            const existing = await this.getLocations();
            const newLocation: OfflineLocation = {
                ...location,
                id: Date.now().toString(),
            };

            if (existing.length >= MAX_LOCATION_QUEUE) {
                existing.shift(); // En eski kaydı çıkar
            }

            existing.push(newLocation);
            await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(existing));
            console.log(`[OfflineStorage] GPS kaydedildi. Kuyruk: ${existing.length}`);
        } catch (error) {
            console.error('[OfflineStorage] GPS kayıt hatası:', error);
        }
    }

    async getLocations(): Promise<OfflineLocation[]> {
        try {
            const json = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch {
            return [];
        }
    }

    async removeLocations(ids: string[]): Promise<void> {
        try {
            const existing = await this.getLocations();
            const filtered = existing.filter((loc) => !ids.includes(loc.id));
            await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('[OfflineStorage] GPS silme hatası:', error);
        }
    }

    async clearLocationQueue(): Promise<void> {
        try {
            await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
        } catch (error) {
            console.error('[OfflineStorage] GPS kuyruğu temizleme hatası:', error);
        }
    }

    async getLocationQueueSize(): Promise<number> {
        const locations = await this.getLocations();
        return locations.length;
    }

    // -----------------------------------------------------------
    // Pending Actions Queue Methods (Offline-First)
    // -----------------------------------------------------------

    /**
     * Bir şoför eylemini offline kuyruğuna ekler.
     * İnternet bağlantısı olmadığında durum güncellemeleri burada bekler.
     *
     * @param type - Eylem tipi ('UPDATE_SHIPMENT_STATUS' | 'COMPLETE_DELIVERY')
     * @param payload - Eyleme özgü veri
     */
    async savePendingAction(
        type: PendingActionType,
        payload: Record<string, unknown>
    ): Promise<PendingAction> {
        try {
            const existing = await this.getPendingActions();
            const action: PendingAction = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                type,
                payload,
                createdAt: new Date().toISOString(),
                retryCount: 0,
            };
            existing.push(action);
            await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(existing));
            console.log(`[OfflineStorage] Eylem kuyruğa alındı: ${type} | Toplam: ${existing.length}`);
            return action;
        } catch (error) {
            console.error('[OfflineStorage] Eylem kayıt hatası:', error);
            throw error;
        }
    }

    /** Tüm pending eylemleri döner */
    async getPendingActions(): Promise<PendingAction[]> {
        try {
            const json = await AsyncStorage.getItem(PENDING_KEY);
            return json ? JSON.parse(json) : [];
        } catch {
            return [];
        }
    }

    /** ID listesine göre eylemleri kuyruktan siler (başarılı sync sonrası) */
    async removePendingActions(ids: string[]): Promise<void> {
        try {
            const existing = await this.getPendingActions();
            const remaining = existing.filter((action) => !ids.includes(action.id));
            await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
            console.log(`[OfflineStorage] ${ids.length} eylem temizlendi. Kalan: ${remaining.length}`);
        } catch (error) {
            console.error('[OfflineStorage] Eylem temizleme hatası:', error);
        }
    }

    /**
     * Belirli bir eylemin retry sayısını artırır.
     * MAX_RETRY_COUNT'a ulaşan eylemler bir sonraki sync'te atlanır.
     */
    async incrementRetryCount(id: string): Promise<void> {
        try {
            const existing = await this.getPendingActions();
            const updated = existing.map((action) =>
                action.id === id
                    ? { ...action, retryCount: action.retryCount + 1 }
                    : action
            );
            await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('[OfflineStorage] Retry sayısı güncelleme hatası:', error);
        }
    }

    /** MAX_RETRY_COUNT'u aşan eski ve başarısız eylemleri temizler */
    async pruneStaleActions(): Promise<void> {
        try {
            const existing = await this.getPendingActions();
            const valid = existing.filter((action) => action.retryCount < MAX_RETRY_COUNT);
            const prunedCount = existing.length - valid.length;
            if (prunedCount > 0) {
                await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(valid));
                console.warn(`[OfflineStorage] ${prunedCount} başarısız eylem kuyruğundan kaldırıldı.`);
            }
        } catch (error) {
            console.error('[OfflineStorage] Stale eylem temizleme hatası:', error);
        }
    }

    async getPendingActionsCount(): Promise<number> {
        const actions = await this.getPendingActions();
        return actions.length;
    }

    async clearPendingActions(): Promise<void> {
        try {
            await AsyncStorage.removeItem(PENDING_KEY);
        } catch (error) {
            console.error('[OfflineStorage] Pending kuyruğu temizleme hatası:', error);
        }
    }
}

export const offlineStorage = new OfflineStorageService();
export { MAX_RETRY_COUNT };
