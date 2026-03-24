/**
 * useNetworkSync — Ağ Bağlantısı İzleme ve Otomatik Sync Hook'u
 *
 * NetInfo ile ağ durumunu gerçek zamanlı izler.
 * Bağlantı false→true geçişinde SyncService.syncPendingActions() tetikler.
 * Bu hook, root _layout.tsx içinde çağrılarak uygulama genelinde aktif olur.
 */

import { useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncService } from '../../services/SyncService';
import { offlineStorage } from '../../services/OfflineStorage';

interface NetworkSyncResult {
    /** Şu an çevrimdışı mı? */
    isOffline: boolean;
    /** Kuyruktaki bekleyen eylem sayısı */
    pendingCount: number;
    /** Sync manuel tetikleme */
    triggerSync: () => Promise<void>;
}

export function useNetworkSync(): NetworkSyncResult {
    const [isOffline, setIsOffline] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    // Son bağlantı durumunu ref ile takip et (closure sorunu olmadan)
    const wasOfflineRef = useRef(false);

    const refreshPendingCount = async () => {
        const count = await offlineStorage.getPendingActionsCount();
        setPendingCount(count);
    };

    const triggerSync = async () => {
        try {
            const synced = await syncService.syncPendingActions();
            if (synced > 0) {
                await refreshPendingCount();
                console.log(`[useNetworkSync] ${synced} eylem senkronize edildi.`);
            }
        } catch (error) {
            console.error('[useNetworkSync] Manuel sync hatası:', error);
        }
    };

    useEffect(() => {
        // İlk yüklemede kuyruk sayısını getir
        refreshPendingCount();

        // NetInfo aboneliği
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const isConnected = state.isConnected === true && state.isInternetReachable !== false;
            const offline = !isConnected;

            setIsOffline(offline);

            // false → true geçişi: bağlantı geri geldi, sync'i tetikle
            if (wasOfflineRef.current && !offline) {
                console.log('[useNetworkSync] 📶 Bağlantı geri geldi — sync tetikleniyor...');
                triggerSync();
            }

            wasOfflineRef.current = offline;
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return { isOffline, pendingCount, triggerSync };
}
