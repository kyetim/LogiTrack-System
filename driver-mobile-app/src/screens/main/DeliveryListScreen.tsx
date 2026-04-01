import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, PackageX } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography } from '@/theme/tokens';
import { DeliveryCard } from '@/components/shared';
import { useAppSelector } from '../../../store';

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

    const allShipments = useAppSelector(state => state.shipments.shipments);

    // Derived Data
    const historyShipments = useMemo(() => {
        // Geçmiş ekranında sadece tamamlanmış ve iptal edilmiş seferler gösterilir
        return allShipments.filter(s => s.status === 'DELIVERED' || s.status === 'CANCELLED');
    }, [allShipments]);

    const filteredDeliveries = useMemo(() => {
        let result = historyShipments;

        // Apply Tab Filter
        if (activeFilter === 'completed') {
            result = result.filter(d => d.status === 'DELIVERED');
        } else if (activeFilter === 'cancelled') {
            result = result.filter(d => d.status === 'CANCELLED');
        }

        // Apply Search Filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(d =>
                (d.origin && d.origin.toLowerCase().includes(query)) ||
                (d.destination && d.destination.toLowerCase().includes(query)) ||
                (d.trackingNumber && d.trackingNumber.toLowerCase().includes(query))
            );
        }

        return result;
    }, [historyShipments, activeFilter, searchQuery]);

    const totalEarnings = useMemo(() => {
        // Redux objesinde fiyat yoksa default bir miktar gösterebiliriz
        // veya şimdilik opsiyonel bir alan ekleyebiliriz. History'de Navlun Ücreti toplamı.
        return filteredDeliveries.length * 1500; // Örnek: her sefer ortalama 1500₺
    }, [filteredDeliveries]);

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <PackageX color={Colors.grayDim} size={48} />
            <Text style={styles.emptyTitle}>Sefer bulunamadı</Text>
            <Text style={styles.emptySubtitle}>Filtreleri değiştirmeyi dene</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Seferlerim</Text>

                <View style={styles.searchContainer}>
                    <Search color={Colors.gray} size={20} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Sefer ara..."
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
                <Text style={styles.summaryLabel}>{filteredDeliveries.length} sefer</Text>
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
                renderItem={({ item }) => {
                    const mappedItem = {
                        id: item.id,
                        customerName: item.trackingNumber || 'Bilinmeyen Müşteri',
                        pickupAddress: item.origin || 'Bilinmeyen Konum',
                        deliveryAddress: item.destination || 'Bilinmeyen Konum',
                        distance: 'Bilinmiyor', // API'de mesafe yoksa varsayılan
                        estimatedTime: (item as any).estimatedArrival ? new Date((item as any).estimatedArrival).toLocaleDateString() : 'Belirtilmedi',
                        price: '₺1500', // API'de price yoksa varsayılan
                        status: (item.status === 'DELIVERED' ? 'completed' : 'cancelled') as any, // Component beklenen propları için map: 'completed' | 'cancelled'
                        packageType: 'standard' as any,
                        date: new Date(item.updatedAt || new Date()).toLocaleDateString()
                    };

                    return (
                        <DeliveryCard
                            {...mappedItem}
                            onPress={() => navigation.navigate('ActiveDelivery', { id: item.id })}
                        />
                    );
                }}
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
