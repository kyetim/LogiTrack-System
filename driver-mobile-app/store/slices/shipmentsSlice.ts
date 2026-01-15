import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { ShipmentsState, Shipment } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';

const initialState: ShipmentsState = {
    shipments: [],
    currentShipment: null,
    isLoading: false,
    error: null,
    lastSync: null,
};

// Async Thunks
export const fetchShipments = createAsyncThunk(
    'shipments/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const shipments = await api.getMyShipments();

            // Cache for offline
            await AsyncStorage.setItem(
                STORAGE_KEYS.CACHED_SHIPMENTS,
                JSON.stringify(shipments)
            );

            return shipments;
        } catch (error: any) {
            // Load from cache if offline
            const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_SHIPMENTS);
            if (cached) {
                return JSON.parse(cached);
            }
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch shipments');
        }
    }
);

export const fetchShipment = createAsyncThunk(
    'shipments/fetchOne',
    async (id: string, { rejectWithValue }) => {
        try {
            const shipment = await api.getShipment(id);
            return shipment;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch shipment');
        }
    }
);

export const updateShipmentStatus = createAsyncThunk(
    'shipments/updateStatus',
    async (
        { id, status }: { id: string; status: Shipment['status'] },
        { rejectWithValue }
    ) => {
        try {
            const shipment = await api.updateShipmentStatus(id, status);
            return shipment;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

// Slice
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
    },
    extraReducers: (builder) => {
        // Fetch all
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

        // Fetch one
        builder.addCase(fetchShipment.fulfilled, (state, action) => {
            state.currentShipment = action.payload;
        });

        // Update status
        builder.addCase(updateShipmentStatus.fulfilled, (state, action) => {
            const index = state.shipments.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.shipments[index] = action.payload;
            }
            if (state.currentShipment?.id === action.payload.id) {
                state.currentShipment = action.payload;
            }
        });
    },
});

export const { clearCurrentShipment, clearError } = shipmentsSlice.actions;
export default shipmentsSlice.reducer;
