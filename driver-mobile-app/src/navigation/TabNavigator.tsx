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

export type TabParamList = {
    HomeTab: undefined;
    JobsTab: undefined;
    MapTab: undefined;
    HistoryTab: undefined;
    ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
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
