import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MessagesState, Message, Conversation } from '../../types';
import { api } from '../../services/api';

const initialState: MessagesState = {
    conversations: [],
    currentMessages: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
    'messages/fetchConversations',
    async () => {
        const response = await api.getConversations();
        return response;
    }
);

export const fetchMessages = createAsyncThunk(
    'messages/fetchMessages',
    async (userId: string) => {
        const response = await api.getMessages(userId);
        return response;
    }
);

export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async ({ recipientId, content }: { recipientId: string; content: string }) => {
        const response = await api.sendMessage(recipientId, content);
        return response;
    }
);

export const markAsRead = createAsyncThunk(
    'messages/markAsRead',
    async (messageId: string) => {
        await api.markMessageAsRead(messageId);
        return messageId;
    }
);

export const markConversationAsRead = createAsyncThunk(
    'messages/markConversationAsRead',
    async (userId: string) => {
        await api.markConversationAsRead(userId);
        return userId;
    }
);

export const fetchUnreadCount = createAsyncThunk(
    'messages/fetchUnreadCount',
    async () => {
        const count = await api.getUnreadCount();
        return count;
    }
);

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<Message>) => {
            state.currentMessages.push(action.payload);
        },
        updateMessage: (state, action: PayloadAction<Message>) => {
            const index = state.currentMessages.findIndex(
                (msg) => msg.id === action.payload.id
            );
            if (index !== -1) {
                state.currentMessages[index] = action.payload;
            }
        },
        clearMessages: (state) => {
            state.currentMessages = [];
        },
        incrementUnreadCount: (state) => {
            state.unreadCount += 1;
        },
        decrementUnreadCount: (state, action: PayloadAction<number>) => {
            state.unreadCount = Math.max(0, state.unreadCount - action.payload);
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch conversations
        builder.addCase(fetchConversations.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchConversations.fulfilled, (state, action) => {
            state.isLoading = false;
            state.conversations = action.payload;
        });
        builder.addCase(fetchConversations.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch conversations';
        });

        // Fetch messages
        builder.addCase(fetchMessages.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            state.isLoading = false;
            state.currentMessages = action.payload;
        });
        builder.addCase(fetchMessages.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch messages';
        });

        // Send message
        builder.addCase(sendMessage.pending, (state) => {
            state.error = null;
        });
        builder.addCase(sendMessage.fulfilled, (state, action) => {
            state.currentMessages.push(action.payload);

            // Also update the matching conversation's lastMessage so the list stays fresh
            const sentMsg = action.payload;
            const otherUserId = sentMsg.recipientId;
            const conv = state.conversations.find(c => c.user.id === otherUserId);
            if (conv) {
                conv.lastMessage = sentMsg;
            }
        });
        builder.addCase(sendMessage.rejected, (state, action) => {
            state.error = action.error.message || 'Failed to send message';
        });

        // Mark as read
        builder.addCase(markAsRead.fulfilled, (state, action) => {
            const message = state.currentMessages.find(
                (msg) => msg.id === action.payload
            );
            if (message) {
                message.read = true;
            }
        });

        // Mark conversation as read
        builder.addCase(markConversationAsRead.fulfilled, (state, action) => {
            const conversation = state.conversations.find(
                (conv) => conv.user.id === action.payload
            );
            if (conversation) {
                conversation.unreadCount = 0;
            }
        });

        // Fetch unread count
        builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
            state.unreadCount = action.payload;
        });
    },
});

export const {
    addMessage,
    updateMessage,
    clearMessages,
    incrementUnreadCount,
    decrementUnreadCount,
    setError,
} = messagesSlice.actions;

export default messagesSlice.reducer;
