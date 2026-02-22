import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { fetchConversations, fetchUnreadCount } from '../../store/slices/messagesSlice';
import { websocketService } from '../../services/websocket';

export default function DrawerLayout() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Start global WebSocket connection here so it's alive regardless of which tab is active
        const setup = async () => {
            await websocketService.connect();

            // Listen for new messages globally — updates badge everywhere
            websocketService.onNewMessage((_message: any) => {
                dispatch(fetchConversations());
                dispatch(fetchUnreadCount());
            });
        };

        setup();

        return () => {
            websocketService.removeAllListeners();
            websocketService.disconnect();
        };
    }, [dispatch]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props: any) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    headerShown: false,
                    drawerActiveBackgroundColor: '#10B981',
                    drawerActiveTintColor: '#fff',
                    drawerInactiveTintColor: '#333',
                    drawerLabelStyle: {
                        marginLeft: -20,
                        fontSize: 16,
                        fontWeight: '600',
                    },
                }}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                        drawerLabel: 'Ana Sayfa',
                        title: 'Ana Sayfa',
                        drawerIcon: ({ color, size }: { color: string; size: number }) => (
                            <MaterialCommunityIcons name="home" size={size} color={color} />
                        ),
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
}
