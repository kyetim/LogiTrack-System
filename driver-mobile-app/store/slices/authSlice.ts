import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { AuthState, User } from '../../types';
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
            console.log('🔐 Login attempt:', email);
            console.log('API URL:', await import('../../utils/constants').then(m => m.API_URL));

            const response = await api.login(email, password);
            console.log('✅ Login API success:', response);

            // Store token
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));

            // Get driver profile
            console.log('📋 Fetching driver profile...');
            const driver = await api.getMyProfile();
            console.log('✅ Driver profile success:', driver);

            // Store driver profile for MQTT
            await AsyncStorage.setItem(STORAGE_KEYS.DRIVER, JSON.stringify(driver));

            return { user: response.user, token: response.access_token, driver };
        } catch (error: any) {
            console.error('❌ Login error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error message:', error.message);

            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            return rejectWithValue(errorMessage);
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        // Clear storage first
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_DATA,
            STORAGE_KEYS.DRIVER,
            STORAGE_KEYS.CACHED_SHIPMENTS,
        ]);

        // Try to call API logout but don't fail if it errors
        try {
            await api.logout();
        } catch (error) {
            console.log('Logout API call failed, but continuing with local logout');
        }

        return null;
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
            state.error = null;
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
