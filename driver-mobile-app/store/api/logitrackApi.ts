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
            query: () => '/scoring/my-score',
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

        // ── Messaging ────────────────────────────────────────────────────────

        /** Konuşma listesini getir (son mesaj + okunmamış sayısı) */
        getConversations: builder.query<Conversation[], void>({
            query: () => '/messages/conversations',
            providesTags: ['Conversation'],
        }),

        /** Belirli bir kullanıcıyla mesaj geçmişini getir */
        getMessages: builder.query<Message[], string>({
            query: (userId) => `/messages/conversation/${userId}`,
            providesTags: (_result, _err, userId) => [{ type: 'Message', id: userId }],
        }),

        /** Okunmamış mesaj sayısını getir */
        getUnreadCount: builder.query<{ count: number }, void>({
            query: () => '/messages/unread-count',
            providesTags: ['Message'],
        }),

        /** Mesaj gönder */
        sendMessage: builder.mutation<Message, { recipientId: string; content: string }>({
            query: (body) => ({
                url: '/messages',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Conversation', 'Message'],
        }),

        /** Mesajı okundu olarak işaretle */
        markMessageAsRead: builder.mutation<void, string>({
            query: (id) => ({
                url: `/messages/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Message', 'Conversation'],
        }),

        // ── Support ──────────────────────────────────────────────────────────

        /** Sürücünün aktif destek talebini getir */
        getMyTicket: builder.query<SupportTicket | null, void>({
            query: () => '/support/my-ticket',
            providesTags: ['SupportTicket'],
        }),

        /** Kapalı/çözülmüş eski talepleri getir */
        getTicketHistory: builder.query<SupportTicket[], void>({
            query: () => '/support/my-ticket/history',
            providesTags: ['SupportTicket'],
        }),

        /** Destek mesajı gönder */
        sendSupportMessage: builder.mutation<void, { content: string }>({
            query: (body) => ({
                url: '/support/my-ticket/messages',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SupportTicket'],
        }),

        /** Talebi kapat */
        closeTicket: builder.mutation<void, void>({
            query: () => ({
                url: '/support/my-ticket/close',
                method: 'PATCH',
            }),
            invalidatesTags: ['SupportTicket'],
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
    // Messaging
    useGetConversationsQuery,
    useGetMessagesQuery,
    useGetUnreadCountQuery,
    useSendMessageMutation,
    useMarkMessageAsReadMutation,
    // Support
    useGetMyTicketQuery,
    useGetTicketHistoryQuery,
    useSendSupportMessageMutation,
    useCloseTicketMutation,
} = logitrackApi;
