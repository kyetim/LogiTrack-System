import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ScoringState, DriverScore, LeaderboardEntry } from '../../types';
import { api } from '../../services/api';

const initialState: ScoringState = {
    leaderboard: [],
    myScore: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchLeaderboard = createAsyncThunk(
    'scoring/fetchLeaderboard',
    async (limit: number = 10) => {
        const response = await api.getLeaderboard(limit);
        return response;
    }
);

export const fetchMyScore = createAsyncThunk(
    'scoring/fetchMyScore',
    async () => {
        const response = await api.getMyScore();
        return response;
    }
);

export const refreshScore = createAsyncThunk(
    'scoring/refreshScore',
    async () => {
        // Fetch both leaderboard and personal score
        const [leaderboard, myScore] = await Promise.all([
            api.getLeaderboard(10),
            api.getMyScore(),
        ]);
        return { leaderboard, myScore };
    }
);

const scoringSlice = createSlice({
    name: 'scoring',
    initialState,
    reducers: {
        clearScoring: (state) => {
            state.leaderboard = [];
            state.myScore = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch leaderboard
        builder.addCase(fetchLeaderboard.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchLeaderboard.fulfilled, (state, action) => {
            state.isLoading = false;
            state.leaderboard = action.payload;
        });
        builder.addCase(fetchLeaderboard.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch leaderboard';
        });

        // Fetch my score
        builder.addCase(fetchMyScore.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchMyScore.fulfilled, (state, action) => {
            state.isLoading = false;
            state.myScore = action.payload;
        });
        builder.addCase(fetchMyScore.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch score';
        });

        // Refresh both
        builder.addCase(refreshScore.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(refreshScore.fulfilled, (state, action) => {
            state.isLoading = false;
            state.leaderboard = action.payload.leaderboard;
            state.myScore = action.payload.myScore;
        });
        builder.addCase(refreshScore.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to refresh scores';
        });
    },
});

export const { clearScoring } = scoringSlice.actions;

export default scoringSlice.reducer;
