import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DocumentsState, Document } from '../../types';
import { api } from '../../services/api';

const initialState: DocumentsState = {
    documents: [],
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchDocuments = createAsyncThunk(
    'documents/fetchDocuments',
    async () => {
        const response = await api.getMyDocuments();
        return response;
    }
);

export const uploadDocument = createAsyncThunk(
    'documents/uploadDocument',
    async (formData: FormData) => {
        const response = await api.uploadDocumentV2(formData);
        return response;
    }
);

export const deleteDocument = createAsyncThunk(
    'documents/deleteDocument',
    async (documentId: string) => {
        await api.deleteDocument(documentId);
        return documentId;
    }
);

export const fetchExpiringDocuments = createAsyncThunk(
    'documents/fetchExpiringDocuments',
    async (days: number = 30) => {
        const response = await api.getExpiringDocuments(days);
        return response;
    }
);

const documentsSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        addDocument: (state, action: PayloadAction<Document>) => {
            state.documents.push(action.payload);
        },
        removeDocument: (state, action: PayloadAction<string>) => {
            state.documents = state.documents.filter(
                (doc) => doc.id !== action.payload
            );
        },
        clearDocuments: (state) => {
            state.documents = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch documents
        builder.addCase(fetchDocuments.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchDocuments.fulfilled, (state, action) => {
            state.isLoading = false;
            state.documents = action.payload;
        });
        builder.addCase(fetchDocuments.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch documents';
        });

        // Upload document
        builder.addCase(uploadDocument.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(uploadDocument.fulfilled, (state, action) => {
            state.isLoading = false;
            state.documents.push(action.payload);
        });
        builder.addCase(uploadDocument.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to upload document';
        });

        // Delete document
        builder.addCase(deleteDocument.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(deleteDocument.fulfilled, (state, action) => {
            state.isLoading = false;
            state.documents = state.documents.filter(
                (doc) => doc.id !== action.payload
            );
        });
        builder.addCase(deleteDocument.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to delete document';
        });

        // Fetch expiring documents
        builder.addCase(fetchExpiringDocuments.fulfilled, (state, action) => {
            // Optionally merge or replace existing documents
            // For now, we just store them separately or update the main list
            state.documents = action.payload;
        });
    },
});

export const { addDocument, removeDocument, clearDocuments } = documentsSlice.actions;

export default documentsSlice.reducer;
