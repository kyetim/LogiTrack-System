import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import secureStorage from '../../src/services/secureStorage';
import { api } from '../../services/api';
import { AuthState, User } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';
import { parseApiError } from '../../utils/apiError';

const initialState: AuthState = {
    user: null,
    driver: null,
    token: null,
    isLoading: false,
    error: null,
};

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await api.login(email, password);

            // Token'ları güvenli depoya kaydet
            await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
            if (response.refresh_token) {
                await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
            }
            await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));

            // Sürücü profilini çek
            const driver = await api.getMyProfile();
            await secureStorage.setItem(STORAGE_KEYS.DRIVER, JSON.stringify(driver));

            return { user: response.user, token: response.access_token, driver };
        } catch (error: unknown) {
            // ✅ Merkezi apiError parser — tüm hata tipleri normalize edilir
            const { message } = parseApiError(error);
            return rejectWithValue(message);
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        // Güvenli depoyu temizle
        await secureStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
            STORAGE_KEYS.DRIVER,
            STORAGE_KEYS.CACHED_SHIPMENTS,
        ]);

        // Eski AsyncStorage token'larını temizle (migrasyon sonrası ghost resurrection önlemi)
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.AUTH_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.DRIVER,
            ]);
        } catch {
            // Sessizce geç
        }

        // Backend logout — başarısız olsa bile yerel logout devam eder
        try {
            await api.logout();
        } catch {
            // Sessizce geç
        }

        // Not: store/index.ts'teki rootReducer,
        // auth/logout/fulfilled'da TÜM slice'ları sıfırlar.
        return null;
    }
);

export const loadStoredAuth = createAsyncThunk(
    'auth/loadStored',
    async (_, { rejectWithValue }) => {
        try {
            // Eski AsyncStorage → SecureStore tek seferlik migrasyon
            const migrateToken = async () => {
                const legacyToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                if (legacyToken) {
                    await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, legacyToken);
                    const legacyUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
                    const legacyDriver = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER);
                    await secureStorage.setItem(STORAGE_KEYS.USER_DATA, legacyUser ?? '');
                    await secureStorage.setItem(STORAGE_KEYS.DRIVER, legacyDriver ?? '');

                    try {
                        await AsyncStorage.multiRemove([
                            STORAGE_KEYS.AUTH_TOKEN,
                            STORAGE_KEYS.USER_DATA,
                            STORAGE_KEYS.DRIVER,
                        ]);
                    } catch {
                        // Sessizce geç
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
            // Güncel sürücü profilini her zaman API'den çek
            const driver = await api.getMyProfile();

            return { user, token, driver };
        } catch {
            return rejectWithValue('No stored authentication');
        }
    }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

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
        // ── Login ──────────────────────────────────────────────────────────
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

        // ── Logout ────────────────────────────────────────────────────────
        // NOT: store/index.ts rootReducer TÜM store'u sıfırlar.
        // Bu case yalnızca fallback olarak kalır.
        builder.addCase(logout.fulfilled, (state) => {
            state.user = null;
            state.token = null;
            state.driver = null;
            state.error = null;
        });

        // ── Load Stored Auth ──────────────────────────────────────────────
        builder.addCase(loadStoredAuth.fulfilled, (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.driver = action.payload.driver;
        });
    },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
