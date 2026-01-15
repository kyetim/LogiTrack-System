import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { AuthState, User, Driver } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';

const initialState: AuthState = {
    user: null,
    driver: null,
    token: null,
    isLoading: false,
    error: null,
};

// Async Thunks
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await api.login(email, password);

            // Store token
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));

            // Get driver profile
            const driver = await api.getMyProfile();

            return { user: response.user, token: response.access_token, driver };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await api.logout();
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.AUTH_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.CACHED_SHIPMENTS,
            ]);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Logout failed');
        }
    }
);

export const loadStoredAuth = createAsyncThunk(
    'auth/loadStored',
    async (_, { rejectWithValue }) => {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

            if (!token || !userData) {
                throw new Error('No stored auth');
            }

            const user: User = JSON.parse(userData);
            const driver = await api.getMyProfile();

            return { user, token, driver };
        } catch (error: any) {
            return rejectWithValue('No stored authentication');
        }
    }
);

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder.addCase(login.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.driver = action.payload.driver;
        });
        builder.addCase(login.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Logout
        builder.addCase(logout.fulfilled, (state) => {
            state.user = null;
            state.token = null;
            state.driver = null;
        });

        // Load stored
        builder.addCase(loadStoredAuth.fulfilled, (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.driver = action.payload.driver;
        });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
