/**
 * SyncService — Offline-First Senkronizasyon Servisi
 *
 * Ağ bağlantısı kesilmiş durumdaki şoför eylemleri (durum güncellemeleri,
 * teslimat tamamlamaları) AsyncStorage'daki kuyruğa yazılır. Bu servis,
 * bağlantı yeniden kurulduğunda kuyruğu sırayla işler ve backend'e gönderir.
 */

import { offlineStorage } from './OfflineStorage';
import { PendingAction } from '../types';
import { api } from './api';

// Senkronizasyon sırasında tek bir çalışma garantisi için kilit
let isSyncing = false;

class SyncService {
    /**
     * Kuyruktaki tüm pending action'ları işler.
     * Her eylem için ilgili API metodunu çağırır.
     * Başarılı gönderilenleri kuyruktan siler, başarısızların retry sayısını artırır.
     *
     * @returns Başarıyla senkronize edilen eylem sayısı
     */
    async syncPendingActions(): Promise<number> {
        if (isSyncing) {
            console.log('[SyncService] Sync zaten devam ediyor, atlandı.');
            return 0;
        }

        isSyncing = true;
        let syncedCount = 0;

        try {
            // Önce çürük (max retry'ı aşmış) eylemleri temizle
            await offlineStorage.pruneStaleActions();

            const pendingActions = await offlineStorage.getPendingActions();

            if (pendingActions.length === 0) {
                console.log('[SyncService] Kuyruk boş, sync gerekmedi.');
                return 0;
            }

            console.log(`[SyncService] ${pendingActions.length} eylem senkronize ediliyor...`);

            const successIds: string[] = [];

            for (const action of pendingActions) {
                try {
                    await this.processAction(action);
                    successIds.push(action.id);
                    syncedCount++;
                    console.log(`[SyncService] ✅ Eylem başarılı: ${action.type} (${action.id})`);
                } catch (error) {
                    console.warn(`[SyncService] ⚠️ Eylem başarısız: ${action.type} (${action.id})`, error);
                    await offlineStorage.incrementRetryCount(action.id);
                }
            }

            if (successIds.length > 0) {
                await offlineStorage.removePendingActions(successIds);
                console.log(`[SyncService] ✅ Sync tamamlandı. ${syncedCount}/${pendingActions.length} eylem başarılı.`);
            }

            return syncedCount;
        } catch (error) {
            console.error('[SyncService] Sync sırasında kritik hata:', error);
            return 0;
        } finally {
            isSyncing = false;
        }
    }

    /**
     * Tek bir pending action'ı işler.
     * Her PendingActionType için uygun API metodu çağrılır.
     */
    private async processAction(action: PendingAction): Promise<void> {
        switch (action.type) {
            case 'UPDATE_SHIPMENT_STATUS': {
                const { shipmentId, status } = action.payload as {
                    shipmentId: string;
                    status: string;
                };
                if (!shipmentId || !status) {
                    throw new Error(`UPDATE_SHIPMENT_STATUS için geçersiz payload: ${JSON.stringify(action.payload)}`);
                }
                await api.updateShipmentStatus(shipmentId, status as any);
                break;
            }

            case 'COMPLETE_DELIVERY': {
                // Müşteriye teslimat (imza/fotoğraflı durum) offline'da kuyruğa atıldıysa burada backend'e iletim sağlanır.
                const { shipmentId, status, photoUrl, signatureUrl, recipientName, notes } = action.payload as {
                    shipmentId: string;
                    status: string;
                    photoUrl?: string; // Lokal URI (Permanent)
                    signatureUrl?: string; // Lokal URI (Permanent)
                    recipientName?: string;
                    notes?: string;
                };

                if (!shipmentId) {
                    throw new Error(`COMPLETE_DELIVERY için shipmentId eksik`);
                }

                // 1. Resimleri ve imzayı API'ye yükle (CDN/Cloud url'leri al)
                let finalPhotoUrl: string | undefined;
                let finalSignatureUrl: string | undefined;

                if (photoUrl) {
                    finalPhotoUrl = await api.uploadPhotoMultipart(photoUrl);
                }

                if (signatureUrl) {
                    // signatureUrl is a local 'file://' uri, backend expects pure Base64 for '/upload/signature-base64'
                    const base64Syntax = await import('expo-file-system/legacy').then(fs =>
                        fs.readAsStringAsync(signatureUrl, { encoding: fs.EncodingType.Base64 })
                    );
                    finalSignatureUrl = await api.uploadSignatureBase64(`data:image/png;base64,${base64Syntax}`);
                }

                // 2. Nihai Teslimat Kanıtı isteğini at
                await api.submitDeliveryProof(shipmentId, {
                    photoUrl: finalPhotoUrl,
                    signatureUrl: finalSignatureUrl,
                    recipientName,
                    notes,
                });
                break;
            }

            default: {
                const exhaustiveCheck: never = action.type;
                throw new Error(`Bilinmeyen eylem tipi: ${exhaustiveCheck}`);
            }
        }
    }

    /** Sync şu an çalışıyor mu? */
    get isRunning(): boolean {
        return isSyncing;
    }
}

export const syncService = new SyncService();
