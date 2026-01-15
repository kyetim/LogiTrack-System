import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LocationState, Coordinates } from '../../types';

const initialState: LocationState = {
    isTracking: false,
    currentLocation: null,
    error: null,
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

export const { startTracking, stopTracking, updateLocation, setError, clearError } =
    locationSlice.actions;
export default locationSlice.reducer;
