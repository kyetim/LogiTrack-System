import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchConversations, fetchUnreadCount } from '../../store/slices/messagesSlice';
import { adminReplied, ticketStatusChanged } from '../../store/slices/supportSlice';
import { websocketService } from '../../services/websocket';
import { useNetworkSync } from '../../src/hooks/useNetworkSync';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { api } from '../../services/api';

export default function DrawerLayout() {
    const dispatch = useAppDispatch();
    const { token } = useAppSelector((state) => state.auth); // Watch Redux auth state
    const wsConnectedRef = useRef(false);

    useNetworkSync(); // Global network listener
    const { expoPushToken } = usePushNotifications(); // Request permissions and get token

    // Register push token with backend once it's obtained
    useEffect(() => {
        if (expoPushToken) {
            api.registerPushToken(expoPushToken).catch(err => {
                console.error('[PushNotif] Failed to register push token:', err);
            });
        }
    }, [expoPushToken]);

    // WebSocket lifecycle tied to auth token — prevents race condition
    useEffect(() => {
        if (!token) {
            // Token cleared (logged out) → disconnect both sockets
            if (wsConnectedRef.current) {
                websocketService.removeAllListeners();
                websocketService.disconnect();
                wsConnectedRef.current = false;
            }
            return;
        }

        // Token available → connect (only once per session)
        if (wsConnectedRef.current) return;

        const setup = async () => {
            // Connect messaging socket (/messaging namespace)
            await websocketService.connect();

            // Connect support socket (main namespace) for admin reply notifications
            await websocketService.connectSupportSocket();

            wsConnectedRef.current = true;

            // Listen for new messages globally — updates badge everywhere
            websocketService.onNewMessage((_message: any) => {
                dispatch(fetchConversations());
                dispatch(fetchUnreadCount());
            });

            // Listen for admin replies — pushes message into support Redux slice globally
            websocketService.onAdminReply((data: any) => {
                if (data?.message) {
                    dispatch(adminReplied(data.message));
                }
            });

            // Listen for ticket status changes (e.g., admin closed the ticket)
            websocketService.onTicketStatusChanged((data: any) => {
                if (data?.status) {
                    dispatch(ticketStatusChanged({ status: data.status }));
                }
            });
        };

        setup();

        return () => {
            websocketService.removeAllListeners();
            websocketService.disconnect(); // also disconnects supportSocket
            wsConnectedRef.current = false;
        };
    }, [token, dispatch]);

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
