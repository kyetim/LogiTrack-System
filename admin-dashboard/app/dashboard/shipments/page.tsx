'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ShipmentFormModal, ShipmentFormData } from '@/components/ShipmentFormModal';
import { TableFilters } from '@/components/TableFilters';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface Shipment {
    id: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    status: string;
    driverId?: string;
    driver?: {
        user: {
            email: string;
        };
    };
    createdAt: string;
}

interface Driver {
    id: string;
    user: {
        email: string;
    };
}

type SortField = 'trackingNumber' | 'origin' | 'destination' | 'status';
type SortOrder = 'asc' | 'desc';

export default function ShipmentsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('trackingNumber');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchShipments();
            fetchDrivers();
        }
    }, [user]);

    const fetchShipments = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/shipments');
            setShipments(data);
        } catch (error) {
            console.error('Failed to fetch shipments:', error);
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const { data } = await api.get('/drivers');
            setDrivers(data);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        }
    };

    // Filtered and sorted shipments
    const filteredShipments = useMemo(() => {
        let filtered = shipments;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.destination.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => s.status === statusFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [shipments, searchTerm, statusFilter, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleCreate = () => {
        setSelectedShipment(null);
        setModalOpen(true);
    };

    const handleEdit = (shipment: Shipment) => {
        setSelectedShipment(shipment);
        setModalOpen(true);
    };

    const handleSubmit = async (data: ShipmentFormData) => {
        try {
            if (selectedShipment) {
                await api.patch(`/shipments/${selectedShipment.id}`, data);
                toast.success(t('users.updateSuccess'));
            } else {
                await api.post('/shipments', data);
                toast.success(t('users.createSuccess'));
            }
            fetchShipments();
        } catch (error: any) {
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('users.deleteConfirm'))) return;

        try {
            await api.delete(`/shipments/${id}`);
            toast.success(t('users.deleteSuccess'));
            fetchShipments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('users.deleteFailed'));
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('shipments.title')}</h1>
                        <p className="text-sm text-gray-600">{t('shipments.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Badge variant="outline">{t(`roles.${user.role}`)}</Badge>
                        <Button onClick={() => router.push('/dashboard')}>{t('users.backToDashboard')}</Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('shipments.allShipments')} ({filteredShipments.length})</CardTitle>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('shipments.addShipment')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <TableFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                            statusOptions={[
                                { value: 'PENDING', label: t('statuses.PENDING') },
                                { value: 'IN_TRANSIT', label: t('statuses.IN_TRANSIT') },
                                { value: 'DELIVERED', label: t('statuses.DELIVERED') },
                                { value: 'CANCELLED', label: t('statuses.CANCELLED') },
                            ]}
                            searchPlaceholder="Takip no, başlangıç veya varış ara..."
                        />

                        {isLoading ? (
                            <div className="text-center py-8">{t('common.loading')}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('trackingNumber')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('shipments.trackingNumber')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('origin')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('shipments.origin')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('destination')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('shipments.destination')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>{t('shipments.assignedDriver')}</TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('status')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('shipments.status')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-right">{t('users.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredShipments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                    Sonuç bulunamadı
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredShipments.map((shipment) => (
                                                <TableRow key={shipment.id}>
                                                    <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                                                    <TableCell>{shipment.origin}</TableCell>
                                                    <TableCell>{shipment.destination}</TableCell>
                                                    <TableCell>
                                                        {shipment.driver ? shipment.driver.user.email : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            shipment.status === 'DELIVERED' ? 'default' :
                                                                shipment.status === 'IN_TRANSIT' ? 'secondary' : 'outline'
                                                        }>
                                                            {t(`statuses.${shipment.status}`)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleEdit(shipment)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(shipment.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            <ShipmentFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                shipment={selectedShipment}
                drivers={drivers}
            />
        </div>
    );
}
