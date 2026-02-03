import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
    mqttEnabled: boolean;
}

const initialState: ConfigState = {
    mqttEnabled: false,
};

const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {
        setMqttEnabled: (state, action: PayloadAction<boolean>) => {
            state.mqttEnabled = action.payload;
        },
    },
});

export const { setMqttEnabled } = configSlice.actions;
export default configSlice.reducer;
