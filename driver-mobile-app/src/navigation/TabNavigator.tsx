import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Briefcase, Map as MapIcon, ClipboardList, User } from 'lucide-react-native';

import { Colors, Typography } from '@/theme/tokens';

// Screens
import { HomeScreen } from '../screens/main/HomeScreen';
import { AvailableJobsScreen } from '../screens/main/AvailableJobsScreen';
import { DeliveryListScreen } from '../screens/main/DeliveryListScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ConversationsScreen } from '../screens/messages/ConversationsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { MessageCircle, Headphones } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useAppSelector } from '../../store';

export type TabParamList = {
    HomeTab: undefined;
    JobsTab: undefined;
    MapTab: undefined;
    HistoryTab: undefined;
    MessagesTab: undefined;
    SupportTab: undefined;
    ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
    const unreadCount = useAppSelector((state) => state.messages.unreadCount);
    const currentTicket = useAppSelector((state) => state.support.currentTicket);
    const hasActiveTicket =
        currentTicket !== null &&
        currentTicket.status !== 'CLOSED' &&
        currentTicket.status !== 'RESOLVED';

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#0D0D0D',
                    borderTopColor: '#1A1A1A',
                    borderTopWidth: 1,
                    height: 64,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#FFD700',
                tabBarInactiveTintColor: '#555555',
                tabBarLabelStyle: {
                    fontFamily: Typography.fontBodyMedium, // Used from tokens which aligns to 'Outfit_500Medium'
                    fontSize: 10,
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Ana Sayfa',
                    tabBarIcon: ({ color }) => <Home color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="JobsTab"
                component={AvailableJobsScreen}
                options={{
                    tabBarLabel: 'İşler',
                    tabBarIcon: ({ color }) => <Briefcase color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="MapTab"
                component={MapScreen}
                options={{
                    tabBarLabel: 'Harita',
                    tabBarIcon: ({ color }) => <MapIcon color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="HistoryTab"
                component={DeliveryListScreen}
                options={{
                    tabBarLabel: 'Geçmiş',
                    tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="MessagesTab"
                component={ConversationsScreen}
                options={{
                    tabBarLabel: 'Mesajlar',
                    tabBarIcon: ({ color }) => (
                        <View>
                            <MessageCircle color={color} size={22} />
                            {unreadCount > 0 && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -4,
                                        right: -6,
                                        backgroundColor: '#FF5252',
                                        borderRadius: 8,
                                        minWidth: 16,
                                        height: 16,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="SupportTab"
                component={SupportScreen}
                options={{
                    tabBarLabel: 'Destek',
                    tabBarIcon: ({ color }) => (
                        <View>
                            <Headphones color={color} size={22} />
                            {hasActiveTicket && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -4,
                                        backgroundColor: '#4CAF50',
                                        borderRadius: 5,
                                        width: 10,
                                        height: 10,
                                    }}
                                />
                            )}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({ color }) => <User color={color} size={22} />,
                }}
            />
        </Tab.Navigator>
    );
};
