/**
 * store/index.ts — Redux Store
 *
 * KRİTİK DÜZELTME: rootReducer wrapper eklendi.
 * auth/logout/fulfilled action'ı dispatch edildiğinde tüm slice'lar ve
 * RTK Query cache'i undefined state ile sıfırlanır.
 * Bu sayede A kullanıcısının verileri B kullanıcısına sızmaz (state poisoning).
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AnyAction, Reducer } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import shipmentsReducer from './slices/shipmentsSlice';
import locationReducer from './slices/locationSlice';
import mapReducer from './slices/mapSlice';
import configReducer from './slices/configSlice';
import messagesReducer from './slices/messagesSlice';
import scoringReducer from './slices/scoringSlice';
import documentsReducer from './slices/documentsSlice';
import geofencingReducer from './slices/geofencingSlice';
import availabilityReducer from './slices/availabilitySlice';
import supportReducer from './slices/supportSlice';
import { logitrackApi } from './api/logitrackApi';
import { RootState } from '../types';
export { RootState };

// ─── Combined Reducer ────────────────────────────────────────────────────────

const appReducer = combineReducers({
    auth: authReducer,
    shipments: shipmentsReducer,
    location: locationReducer,
    map: mapReducer,
    config: configReducer,
    messages: messagesReducer,
    scoring: scoringReducer,
    documents: documentsReducer,
    geofencing: geofencingReducer,
    availability: availabilityReducer,
    support: supportReducer,
    // RTK Query — handles own caching & lifecycle
    [logitrackApi.reducerPath]: logitrackApi.reducer,
});

// ─── Root Reducer — Full Store Wipe on Logout ────────────────────────────────
//
// Neden gerekli:
//   authSlice.clearAuth sadece auth slice'ını sıfırlar.
//   shipmentsSlice, messagesSlice, scoringSlice vb. stale RAM verisi
//   tutar ve bir sonraki kullanıcıya kısa süre görünür olabilir.
//
// Çözüm:
//   auth/logout/fulfilled geldiğinde TÜM reducer'lara `state = undefined`
//   gönderilir → her reducer kendi initialState'ine döner.
//   RTK Query cache'i de aynı anda temizlenir.

type AppState = ReturnType<typeof appReducer>;

const rootReducer: Reducer<AppState, AnyAction> = (
    state: AppState | undefined,
    action: AnyAction
): AppState => {
    if (action.type === 'auth/logout/fulfilled') {
        // state = undefined → tüm slice'lar initialState'e döner
        return appReducer(undefined, action);
    }
    return appReducer(state, action);
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'shipments/fetch/fulfilled',
                    'shipments/updateStatus/fulfilled',
                ],
                ignoredActionPaths: [
                    'payload.lastSync',
                    'payload.pendingAction.createdAt',
                    'meta.arg',
                    'meta.baseQueryMeta',
                ],
                ignoredPaths: ['shipments.lastSync'],
            },
        }).concat(logitrackApi.middleware),
});

export type AppDispatch = typeof store.dispatch;

// ─── Typed Hooks ─────────────────────────────────────────────────────────────

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
