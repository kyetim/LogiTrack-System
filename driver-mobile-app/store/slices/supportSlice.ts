import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Types
export interface SupportMessage {
    id: string;
    ticketId: string;
    senderId: string;
    sender: {
        id: string;
        email: string;
        role: string;
    };
    content: string;
    isInternal: boolean;
    isSystemMessage: boolean;
    attachments?: string[];
    createdAt: string;
}

export interface SupportTicket {
    id: string;
    ticketNumber: string;
    driverId: string;
    assignedToId?: string;
    assignedTo?: {
        id: string;
        email: string;
        role: string;
    };
    subject: string;
    status: 'OPEN' | 'ASSIGNED' | 'WAITING_REPLY' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    createdAt: string;
    updatedAt: string;
    messages: SupportMessage[];
}

interface SupportState {
    currentTicket: SupportTicket | null;
    messages: SupportMessage[];
    isLoading: boolean;
    isSending: boolean;
    error: string | null;
}

const initialState: SupportState = {
    currentTicket: null,
    messages: [],
    isLoading: false,
    isSending: false,
    error: null,
};

// Async thunks
export const fetchMyTicket = createAsyncThunk(
    'support/fetchMyTicket',
    async () => {
        const response = await api.getMyTicket();
        return response;
    }
);

export const sendSupportMessage = createAsyncThunk(
    'support/sendMessage',
    async (content: string) => {
        const response = await api.sendSupportMessage(content);
        return response;
    }
);

export const closeMyTicket = createAsyncThunk(
    'support/closeTicket',
    async () => {
        const response = await api.closeMyTicket();
        return response;
    }
);

const supportSlice = createSlice({
    name: 'support',
    initialState,
    reducers: {
        // Real-time message from WebSocket
        addSupportMessage: (state, action: PayloadAction<SupportMessage>) => {
            state.messages.push(action.payload);
        },
        // Admin assigned ticket
        ticketAssigned: (state, action: PayloadAction<{ admin: any }>) => {
            if (state.currentTicket) {
                state.currentTicket.assignedTo = action.payload.admin;
                state.currentTicket.status = 'ASSIGNED';
            }
        },
        // Admin replied
        adminReplied: (state, action: PayloadAction<SupportMessage>) => {
            state.messages.push(action.payload);
            if (state.currentTicket) {
                state.currentTicket.status = 'IN_PROGRESS';
            }
        },
        // Ticket status changed
        ticketStatusChanged: (state, action: PayloadAction<{ status: SupportTicket['status'] }>) => {
            if (state.currentTicket) {
                state.currentTicket.status = action.payload.status;
            }
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch my ticket
        builder.addCase(fetchMyTicket.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchMyTicket.fulfilled, (state, action) => {
            state.isLoading = false;
            state.currentTicket = action.payload;
            state.messages = action.payload.messages || [];
        });
        builder.addCase(fetchMyTicket.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch ticket';
        });

        // Send message
        builder.addCase(sendSupportMessage.pending, (state) => {
            state.isSending = true;
            state.error = null;
        });
        builder.addCase(sendSupportMessage.fulfilled, (state, action) => {
            state.isSending = false;
            state.messages.push(action.payload);
            if (state.currentTicket) {
                state.currentTicket.status = 'WAITING_REPLY';
            }
        });
        builder.addCase(sendSupportMessage.rejected, (state, action) => {
            state.isSending = false;
            state.error = action.error.message || 'Failed to send message';
        });

        // Close ticket
        builder.addCase(closeMyTicket.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(closeMyTicket.fulfilled, (state, action) => {
            state.isLoading = false;
            if (state.currentTicket) {
                state.currentTicket.status = 'CLOSED';
            }
        });
        builder.addCase(closeMyTicket.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to close ticket';
        });
    },
});

export const {
    addSupportMessage,
    ticketAssigned,
    adminReplied,
    ticketStatusChanged,
    clearError,
} = supportSlice.actions;

export default supportSlice.reducer;
