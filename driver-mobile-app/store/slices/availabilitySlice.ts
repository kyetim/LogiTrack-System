import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AvailabilityState, AvailabilityStatus } from '../../types';
import { api } from '../../services/api';

const initialState: AvailabilityState = {
    status: 'OFF_DUTY',
    isUpdating: false,
    error: null,
};

// Async thunks
export const updateAvailability = createAsyncThunk(
    'availability/updateStatus',
    async (status: AvailabilityStatus) => {
        const response = await api.updateAvailability(status);

        // Map backend response back to frontend status
        if (response.status === 'ON_DUTY' && response.isAvailable === true) {
            return 'AVAILABLE';
        }

        return response.status || status;
    }
);

export const fetchAvailabilitySummary = createAsyncThunk(
    'availability/fetchSummary',
    async () => {
        const response = await api.getAvailabilitySummary();
        return response;
    }
);

const availabilitySlice = createSlice({
    name: 'availability',
    initialState,
    reducers: {
        setStatus: (state, action: PayloadAction<AvailabilityStatus>) => {
            state.status = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Update availability
        builder.addCase(updateAvailability.pending, (state) => {
            state.isUpdating = true;
            state.error = null;
        });
        builder.addCase(updateAvailability.fulfilled, (state, action) => {
            state.isUpdating = false;
            state.status = action.payload;
        });
        builder.addCase(updateAvailability.rejected, (state, action) => {
            state.isUpdating = false;
            state.error = action.error.message || 'Failed to update availability';
        });

        // Fetch summary
        builder.addCase(fetchAvailabilitySummary.fulfilled, (state, action) => {
            state.status = action.payload.status;
        });
    },
});

export const { setStatus, clearError } = availabilitySlice.actions;

export default availabilitySlice.reducer;
