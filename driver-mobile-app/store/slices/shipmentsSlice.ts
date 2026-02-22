import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../../services/api';
import { offlineStorage } from '../../services/OfflineStorage';
import { ShipmentsState, Shipment, PendingAction } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';

const initialState: ShipmentsState = {
    shipments: [],
    currentShipment: null,
    isLoading: false,
    error: null,
    lastSync: null,
    pendingActions: [],
    isOffline: false,
};

// ============================================================
// Async Thunks
// ============================================================

/** Şoföre atanmış sevkiyatları getirir. İnternet yoksa önbellekten döner. */
export const fetchShipments = createAsyncThunk(
    'shipments/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const shipments = await api.getMyShipments();
            // Başarılı çekimde önbelleği güncelle
            await AsyncStorage.setItem(
                STORAGE_KEYS.CACHED_SHIPMENTS,
                JSON.stringify(shipments)
            );
            return shipments;
        } catch {
            // Offline: önbellekten oku
            const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_SHIPMENTS);
            if (cached) {
                return JSON.parse(cached) as Shipment[];
            }
            return rejectWithValue('Sevkiyatlar yüklenemedi ve önbellek bulunamadı.');
        }
    }
);

/** Tek sevkiyat detayı — önce önbellekten, yoksa API'den */
export const fetchShipment = createAsyncThunk(
    'shipments/fetchOne',
    async (id: string, { getState, rejectWithValue }) => {
        try {
            const shipment = await api.getShipment(id);
            return shipment;
        } catch {
            // Offline: Redux state'ten ara
            const state = (getState() as { shipments: ShipmentsState }).shipments;
            const cached = state.shipments.find((s) => s.id === id);
            if (cached) return cached;
            return rejectWithValue(`Sevkiyat (${id}) bulunamadı.`);
        }
    }
);

/**
 * Sevkiyat durumunu günceller.
 *
 * Offline-First Stratejisi:
 * 1. Ağ bağlantısı var  → Direkt API çağrısı
 * 2. Ağ bağlantısı yok → Redux state'i optimistik güncelle + PendingAction kuyruğuna yaz
 *    İnternet geldiğinde SyncService otomatik senkronize eder.
 */
export const updateShipmentStatus = createAsyncThunk(
    'shipments/updateStatus',
    async (
        { id, status }: { id: string; status: Shipment['status'] },
        { rejectWithValue }
    ) => {
        const netState = await NetInfo.fetch();
        const isConnected =
            netState.isConnected === true && netState.isInternetReachable !== false;

        if (isConnected) {
            // ✅ Online: Standart API çağrısı
            try {
                const shipment = await api.updateShipmentStatus(id, status);
                return { shipment, queued: false };
            } catch (error: any) {
                return rejectWithValue(
                    error.response?.data?.message || 'Durum güncellenemedi.'
                );
            }
        } else {
            // 📵 Offline: Kuyruğa al, optimistik güncelleme yap
            const action = await offlineStorage.savePendingAction(
                'UPDATE_SHIPMENT_STATUS',
                { shipmentId: id, status }
            );
            console.log(`[shipmentsSlice] Offline: Eylem kuyruğa alındı (${action.id})`);
            // Optimistik güncelleme: reducer id+status bilgisini alacak
            return { shipment: { id, status } as Partial<Shipment> & { id: string; status: Shipment['status'] }, queued: true, pendingAction: action };
        }
    }
);

// ============================================================
// Slice
// ============================================================

const shipmentsSlice = createSlice({
    name: 'shipments',
    initialState,
    reducers: {
        clearCurrentShipment: (state) => {
            state.currentShipment = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        /** Offline-first: sync tamamlanınca pending action sil */
        removePendingAction: (state, action: PayloadAction<string>) => {
            state.pendingActions = state.pendingActions.filter(
                (a) => a.id !== action.payload
            );
        },
        /** Offline-first: ağ durumunu Redux'a yansıt */
        setOfflineStatus: (state, action: PayloadAction<boolean>) => {
            state.isOffline = action.payload;
        },
        /** Offline-first: kuyruğu yenile (sync sonrası) */
        setPendingActions: (state, action: PayloadAction<PendingAction[]>) => {
            state.pendingActions = action.payload;
        },
    },
    extraReducers: (builder) => {
        // --- fetchShipments ---
        builder.addCase(fetchShipments.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchShipments.fulfilled, (state, action) => {
            state.isLoading = false;
            state.shipments = action.payload;
            state.lastSync = new Date();
        });
        builder.addCase(fetchShipments.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // --- fetchShipment ---
        builder.addCase(fetchShipment.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchShipment.fulfilled, (state, action) => {
            state.isLoading = false;
            state.currentShipment = action.payload;
        });
        builder.addCase(fetchShipment.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // --- updateShipmentStatus ---
        builder.addCase(updateShipmentStatus.fulfilled, (state, action) => {
            const { shipment, queued, pendingAction } = action.payload;

            // Hem online hem offline durumda shipment listesini güncelle
            const index = state.shipments.findIndex((s) => s.id === shipment.id);
            if (index !== -1) {
                state.shipments[index] = {
                    ...state.shipments[index],
                    status: shipment.status,
                };
            }
            if (state.currentShipment?.id === shipment.id) {
                state.currentShipment = {
                    ...state.currentShipment,
                    status: shipment.status,
                };
            }

            // Offline kuyruk bilgisini state'e ekle
            if (queued && pendingAction) {
                state.pendingActions.push(pendingAction);
            }
        });
        builder.addCase(updateShipmentStatus.rejected, (state, action) => {
            state.error = action.payload as string;
        });
    },
});

export const {
    clearCurrentShipment,
    clearError,
    removePendingAction,
    setOfflineStatus,
    setPendingActions,
} = shipmentsSlice.actions;

export default shipmentsSlice.reducer;
