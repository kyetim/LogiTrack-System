import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ActiveDeliveryScreen } from '../screens/main/ActiveDeliveryScreen';
import { JobDetailScreen } from '../screens/main/JobDetailScreen';
import { ProofOfDeliveryScreen } from '../screens/delivery/ProofOfDeliveryScreen';
import { CompleteDeliveryScreen } from '../screens/delivery/CompleteDeliveryScreen';
import { ReportIssueScreen } from '../screens/delivery/ReportIssueScreen';
import { EarningsScreen } from '../screens/profile/EarningsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';
import { LeaderboardScreen } from '../screens/profile/LeaderboardScreen';
import { ConversationDetailScreen } from '../screens/messages/ConversationDetailScreen';
import { useAppSelector } from '../../store';
import mqttService from '../../services/mqttService';
import OfflineBanner from '../components/shared/OfflineBanner';
import { ToastNotification, ToastType } from '../components/shared/ToastNotification';

export type MainStackParamList = {
    MainTabs: undefined;
    ActiveDelivery: { id?: string };
    JobDetail: { id: string };
    ProofOfDelivery: { id?: string };
    CompleteDelivery: undefined;
    ReportIssue: { id?: string };
    Earnings: undefined;
    Support: undefined;
    ConversationDetail: { userId: string; email: string };
    Settings: undefined;
    Documents: undefined;
    Leaderboard: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
    const user = useAppSelector((state: any) => state.auth.user);
    const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false,
    });

    useEffect(() => {
        if (!user?.id) return;

        mqttService.connect().then((success) => {
            if (success) {
                setToast({ message: 'MQTT bağlantısı kuruldu', type: 'success', isVisible: true });
            }
        });

        mqttService.onMessage((topic, payload) => {
            setToast({ message: payload, type: 'info', isVisible: true });
        });

        return () => {
            mqttService.disconnect();
        };
    }, [user?.id]);

    return (
        <View style={{ flex: 1 }}>
            <Stack.Navigator
                initialRouteName="MainTabs"
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0D0D0D' },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
                <Stack.Screen name="JobDetail" component={JobDetailScreen} />
                <Stack.Screen
                    name="ProofOfDelivery"
                    component={ProofOfDeliveryScreen}
                />
                <Stack.Screen
                    name="CompleteDelivery"
                    component={CompleteDeliveryScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                    name="ReportIssue"
                    component={ReportIssueScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Earnings"
                    component={EarningsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Support"
                    component={SupportScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ConversationDetail"
                    component={ConversationDetailScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Documents"
                    component={DocumentsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Leaderboard"
                    component={LeaderboardScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>

            <OfflineBanner />
            <ToastNotification
                message={toast.message}
                type={toast.type as ToastType}
                isVisible={toast.isVisible}
                onDismiss={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </View>
    );
};
