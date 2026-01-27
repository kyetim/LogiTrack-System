import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
    useMQTT: boolean;
    mqttEnabled: boolean;
}

const initialState: ConfigState = {
    useMQTT: false, // Default: WebSocket
    mqttEnabled: false,
};

const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {
        setUseMQTT: (state, action: PayloadAction<boolean>) => {
            state.useMQTT = action.payload;
        },
        setMqttEnabled: (state, action: PayloadAction<boolean>) => {
            state.mqttEnabled = action.payload;
        },
    },
});

export const { setUseMQTT, setMqttEnabled } = configSlice.actions;
export default configSlice.reducer;
