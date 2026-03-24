import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Region } from 'react-native-maps';

interface MapState {
    selectedShipmentId: string | null;
    mapRegion: Region | null;
    showUserLocation: boolean;
}

const initialState: MapState = {
    selectedShipmentId: null,
    mapRegion: null,
    showUserLocation: true,
};

const mapSlice = createSlice({
    name: 'map',
    initialState,
    reducers: {
        setSelectedShipment: (state, action: PayloadAction<string | null>) => {
            state.selectedShipmentId = action.payload;
        },
        setMapRegion: (state, action: PayloadAction<Region>) => {
            state.mapRegion = action.payload;
        },
        toggleUserLocation: (state) => {
            state.showUserLocation = !state.showUserLocation;
        },
        clearSelection: (state) => {
            state.selectedShipmentId = null;
        },
    },
});

export const { setSelectedShipment, setMapRegion, toggleUserLocation, clearSelection } =
    mapSlice.actions;

export default mapSlice.reducer;
