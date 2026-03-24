import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GeofencingState, Geofence, GeofenceEvent, GeofenceCheckResult } from '../../types';
import { api } from '../../services/api';

const initialState: GeofencingState = {
    geofences: [],
    events: [],
    currentCheck: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchGeofences = createAsyncThunk(
    'geofencing/fetchGeofences',
    async () => {
        const response = await api.getGeofences();
        return response;
    }
);

export const checkLocation = createAsyncThunk(
    'geofencing/checkLocation',
    async ({ lat, lng }: { lat: number; lng: number }) => {
        const response = await api.checkLocation(lat, lng);
        return response;
    }
);

export const fetchGeofenceEvents = createAsyncThunk(
    'geofencing/fetchEvents',
    async (limit: number = 50) => {
        const response = await api.getGeofenceEvents(limit);
        return response;
    }
);

const geofencingSlice = createSlice({
    name: 'geofencing',
    initialState,
    reducers: {
        addGeofenceEvent: (state, action: PayloadAction<GeofenceEvent>) => {
            state.events.unshift(action.payload); // Add to beginning
            // Keep only last 100 events
            if (state.events.length > 100) {
                state.events = state.events.slice(0, 100);
            }
        },
        clearGeofenceCheck: (state) => {
            state.currentCheck = null;
        },
        clearGeofencingError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch geofences
        builder.addCase(fetchGeofences.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchGeofences.fulfilled, (state, action) => {
            state.isLoading = false;
            state.geofences = action.payload;
        });
        builder.addCase(fetchGeofences.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch geofences';
        });

        // Check location
        builder.addCase(checkLocation.pending, (state) => {
            state.error = null;
        });
        builder.addCase(checkLocation.fulfilled, (state, action) => {
            state.currentCheck = action.payload;
        });
        builder.addCase(checkLocation.rejected, (state, action) => {
            state.error = action.error.message || 'Failed to check location';
        });

        // Fetch events
        builder.addCase(fetchGeofenceEvents.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchGeofenceEvents.fulfilled, (state, action) => {
            state.isLoading = false;
            state.events = action.payload;
        });
        builder.addCase(fetchGeofenceEvents.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch events';
        });
    },
});

export const {
    addGeofenceEvent,
    clearGeofenceCheck,
    clearGeofencingError,
} = geofencingSlice.actions;

export default geofencingSlice.reducer;
