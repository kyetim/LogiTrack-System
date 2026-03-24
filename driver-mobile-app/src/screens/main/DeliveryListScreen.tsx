import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, PackageX } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography } from '@/theme/tokens';
import { mockDeliveries } from '@/data/mockData';
import { DeliveryCard } from '@/components/shared';

type FilterType = 'all' | 'completed' | 'cancelled';

import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { TabParamList } from '@/navigation/TabNavigator';

type ScreenNavProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'HistoryTab'>,
    NativeStackNavigationProp<MainStackParamList>
>;

export const DeliveryListScreen = () => {
    const navigation = useNavigation<ScreenNavProp>();

    // State
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Derived Data
    const filteredDeliveries = useMemo(() => {
        let result = mockDeliveries;

        // Apply Tab Filter
        if (activeFilter !== 'all') {
            result = result.filter(d => d.status === activeFilter);
        }

        // Apply Search Filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.customerName.toLowerCase().includes(query) ||
                d.pickupAddress.toLowerCase().includes(query) ||
                d.deliveryAddress.toLowerCase().includes(query)
            );
        }

        return result;
    }, [activeFilter, searchQuery]);

    const totalEarnings = useMemo(() => {
        return filteredDeliveries.reduce((sum, current) => {
            const priceVal = parseInt(current.price.replace('₺', ''), 10);
            return sum + (isNaN(priceVal) ? 0 : priceVal);
        }, 0);
    }, [filteredDeliveries]);

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <PackageX color={Colors.grayDim} size={48} />
            <Text style={styles.emptyTitle}>Teslimat bulunamadı</Text>
            <Text style={styles.emptySubtitle}>Filtreleri değiştirmeyi dene</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Teslimatlarım</Text>

                <View style={styles.searchContainer}>
                    <Search color={Colors.gray} size={20} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Teslimat ara..."
                        placeholderTextColor="#444"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* ─── FİLTRE ÇİPLERİ ─── */}
            <View style={styles.filterSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {(['all', 'completed', 'cancelled'] as FilterType[]).map((filter) => {
                        const isActive = activeFilter === filter;
                        const label = filter === 'all' ? 'Tümü' : (filter === 'completed' ? 'Tamamlanan' : 'İptal');

                        return (
                            <TouchableOpacity
                                key={filter}
                                activeOpacity={0.8}
                                onPress={() => setActiveFilter(filter)}
                                style={[styles.filterChip, isActive && styles.activeFilterChip]}
                            >
                                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ─── ÖZET SATIRI ─── */}
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{filteredDeliveries.length} teslimat</Text>
                <Text style={styles.summaryValue}>₺{totalEarnings}</Text>
            </View>

            {/* ─── LİSTE ─── */}
            <FlatList
                data={filteredDeliveries}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                getItemLayout={(data, index) => ({
                    length: 172,
                    offset: 172 * index,
                    index,
                })}
                ListEmptyComponent={renderEmptyState}
                renderItem={({ item }) => (
                    <DeliveryCard
                        {...item}
                        onPress={() => navigation.navigate('ActiveDelivery', { id: item.id })}
                    />
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 22,
        color: Colors.white,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
    },
    filterSection: {
        marginBottom: 16,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        backgroundColor: Colors.card,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeFilterChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    activeFilterText: {
        fontFamily: Typography.fontDisplay,
        color: '#000',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    summaryLabel: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    summaryValue: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.primary,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
});
