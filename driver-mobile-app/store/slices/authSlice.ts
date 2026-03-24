import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import secureStorage from '../../src/services/secureStorage';
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
            await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
            await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));

            // Get driver profile
            console.log('📋 Fetching driver profile...');
            const driver = await api.getMyProfile();
            console.log('✅ Driver profile success:', driver);

            // Store driver profile for MQTT
            await secureStorage.setItem(STORAGE_KEYS.DRIVER, JSON.stringify(driver));

            return { user: response.user, token: response.access_token, driver };
        } catch (error: any) {
            console.log('❌ Login error:', error);
            console.log('Error response:', error.response?.data);
            console.log('Error status:', error.response?.status);
            console.log('Error message:', error.message);

            let errorMessage = 'Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.';

            if (error.response?.data?.message) {
                // If backend provided a specific message (string or array of strings)
                errorMessage = Array.isArray(error.response.data.message)
                    ? error.response.data.message.join('\n')
                    : error.response.data.message;
            } else if (error.message) {
                // Translate raw Axios errors
                if (error.message.includes('Network Error')) {
                    errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
                } else if (error.message.includes('401')) {
                    errorMessage = 'E-posta adresiniz veya şifreniz hatalı.';
                } else if (error.message.includes('403')) {
                    errorMessage = 'Hesabınız onaylanmamış veya askıya alınmış olabilir.';
                } else if (error.message.includes('404')) {
                    errorMessage = 'Böyle bir hesap bulunamadı.';
                } else {
                    errorMessage = error.message; // Fallback to whatever axios threw
                }
            }

            return rejectWithValue(errorMessage);
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        // Clear storage first
        await secureStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_DATA,
            STORAGE_KEYS.DRIVER,
            STORAGE_KEYS.CACHED_SHIPMENTS,
        ]);

        // Clear legacy AsyncStorage tokens to prevent ghost resurrection during loadStoredAuth migration
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.AUTH_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.DRIVER,
            ]);
        } catch (e) {
            // ignore
        }

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
            // Eski AsyncStorage'dan yeni SecureStore'a tek seferlik migrasyon
            const migrateToken = async () => {
                const legacyToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                if (legacyToken) {
                    await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, legacyToken);
                    await secureStorage.setItem(STORAGE_KEYS.USER_DATA,
                        await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA) ?? '');
                    await secureStorage.setItem(STORAGE_KEYS.DRIVER,
                        await AsyncStorage.getItem(STORAGE_KEYS.DRIVER) ?? '');

                    // Legacy'i temizle
                    try {
                        await AsyncStorage.multiRemove([
                            STORAGE_KEYS.AUTH_TOKEN,
                            STORAGE_KEYS.USER_DATA,
                            STORAGE_KEYS.DRIVER,
                        ]);
                    } catch (e) {
                        // ignore
                    }
                }
            };

            await migrateToken();

            const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const userData = await secureStorage.getItem(STORAGE_KEYS.USER_DATA);

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
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.driver = null;
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

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
