import { Stack } from 'expo-router';

export default function ShipmentsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Sevkiyatlar',
                }}
            />
            <Stack.Screen
                name="[id]/delivery-proof"
                options={{
                    title: 'Teslimat Kanıtı',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: true,
                    headerBackTitle: 'Geri',
                    presentation: 'card',
                }}
            />
        </Stack>
    );
}
