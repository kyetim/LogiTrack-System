import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LocationState, Coordinates } from '../../types';

const initialState: LocationState = {
    isTracking: false,
    currentLocation: null,
    error: null,
    lastUpdate: null,
    isConnected: false,
    locationHistory: [],
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        startTracking: (state) => {
            state.isTracking = true;
            state.error = null;
        },
        stopTracking: (state) => {
            state.isTracking = false;
        },
        updateLocation: (state, action: PayloadAction<Coordinates>) => {
            state.currentLocation = action.payload;
            state.lastUpdate = new Date();
            // Add to history (keep last 10)
            state.locationHistory = [action.payload, ...state.locationHistory].slice(0, 10);
        },
        setConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isTracking = false;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { startTracking, stopTracking, updateLocation, setConnected, setError, clearError } =
    locationSlice.actions;
export default locationSlice.reducer;
