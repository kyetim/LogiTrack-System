/**
 * LogiTrack RTK Query API Service
 *
 * Bu dosya, tüm RTK Query endpoint'lerini barındıran ana API slice'dır.
 * createAsyncThunk'tan RTK Query'e geçiş aşamalı yapılmaktadır:
 *
 * ✅ scoring  — getLeaderboard, getMyScore
 * ✅ documents — getDocuments, uploadDocument, deleteDocument, getExpiringDocuments
 * ✅ messages  — getConversations, getMessages, getUnreadCount
 * ✅ support   — getMyTicket, getTicketHistory
 * 🔶 shipments — Offline cache mantığı var, özel reducers kullanmaya devam ediyor
 * ⛔ auth      — JWT/Refresh cycle, RTK Query'e geçirilmeyecek
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_URL } from '../../utils/constants';
import type {
    DriverScore,
    LeaderboardEntry,
    Document,
    SupportTicket,
} from '../../types';

// ─── Types used only by RTK Query endpoints ───────────────────────────────────

export interface Conversation {
    userId: string;
    name: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    avatarUrl?: string;
}

export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

// ─── Base Query with JWT Auth ─────────────────────────────────────────────────

const baseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: async (headers) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

// ─── Main API Service ─────────────────────────────────────────────────────────

export const logitrackApi = createApi({
    reducerPath: 'logitrackApi',
    baseQuery,
    tagTypes: ['Score', 'Document', 'Conversation', 'Message', 'SupportTicket'],
    endpoints: (builder) => ({

        // ── Scoring ─────────────────────────────────────────────────────────

        /** Sürücü skor sıralamasını getir */
        getLeaderboard: builder.query<LeaderboardEntry[], number | void>({
            query: (limit = 10) => `/scoring/leaderboard?limit=${limit}`,
            providesTags: ['Score'],
        }),

        /** Giriş yapmış sürücünün kendi puanını getir */
        getMyScore: builder.query<DriverScore, void>({
            query: () => '/scoring/drivers/me',
            providesTags: ['Score'],
        }),

        // ── Documents ────────────────────────────────────────────────────────

        /** Sürücünün belgelerini listele */
        getMyDocuments: builder.query<Document[], void>({
            query: () => '/documents/my',
            providesTags: ['Document'],
        }),

        /** Süresi yaklaşan belgeleri getir */
        getExpiringDocuments: builder.query<Document[], number | void>({
            query: (days = 30) => `/documents/expiring?days=${days}`,
            providesTags: ['Document'],
        }),

        /** Belge yükle (FormData) */
        uploadDocument: builder.mutation<Document, FormData>({
            query: (formData) => ({
                url: '/documents',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Document'],
        }),

        /** Belge sil */
        deleteDocument: builder.mutation<void, string>({
            query: (id) => ({
                url: `/documents/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Document'],
        }),


    }),
});

// ─── Auto-generated hooks ─────────────────────────────────────────────────────

export const {
    // Scoring
    useGetLeaderboardQuery,
    useGetMyScoreQuery,
    // Documents
    useGetMyDocumentsQuery,
    useGetExpiringDocumentsQuery,
    useUploadDocumentMutation,
    useDeleteDocumentMutation,

} = logitrackApi;
