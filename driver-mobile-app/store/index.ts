import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
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

export const store = configureStore({
    reducer: {
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
        // RTK Query API — handles own caching & lifecycle
        [logitrackApi.reducerPath]: logitrackApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['shipments/fetch/fulfilled', 'shipments/updateStatus/fulfilled'],
                ignoredActionPaths: ['payload.lastSync', 'payload.pendingAction.createdAt'],
                ignoredPaths: ['shipments.lastSync'],
            },
        }).concat(logitrackApi.middleware),
});

export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

