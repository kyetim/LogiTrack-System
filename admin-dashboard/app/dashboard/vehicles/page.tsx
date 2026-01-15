'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { VehicleFormModal, VehicleFormData } from '@/components/VehicleFormModal';
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

interface Vehicle {
    id: string;
    plateNumber: string;
    model: string;
    capacity: number;
    status: string;
    createdAt: string;
}

type SortField = 'plateNumber' | 'model' | 'capacity' | 'status';
type SortOrder = 'asc' | 'desc';

export default function VehiclesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('plateNumber');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchVehicles();
        }
    }, [user]);

    const fetchVehicles = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/vehicles');
            setVehicles(data);
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    // Filtered and sorted vehicles
    const filteredVehicles = useMemo(() => {
        let filtered = vehicles;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(v =>
                v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.model.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(v => v.status === statusFilter);
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
    }, [vehicles, searchTerm, statusFilter, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleCreate = () => {
        setSelectedVehicle(null);
        setModalOpen(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setModalOpen(true);
    };

    const handleSubmit = async (data: VehicleFormData) => {
        try {
            if (selectedVehicle) {
                await api.patch(`/vehicles/${selectedVehicle.id}`, data);
                toast.success(t('users.updateSuccess'));
            } else {
                await api.post('/vehicles', data);
                toast.success(t('users.createSuccess'));
            }
            fetchVehicles();
        } catch (error: any) {
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('users.deleteConfirm'))) return;

        try {
            await api.delete(`/vehicles/${id}`);
            toast.success(t('users.deleteSuccess'));
            fetchVehicles();
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
                        <h1 className="text-2xl font-bold text-gray-900">{t('vehicles.title')}</h1>
                        <p className="text-sm text-gray-600">{t('vehicles.subtitle')}</p>
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
                        <CardTitle>{t('vehicles.allVehicles')} ({filteredVehicles.length})</CardTitle>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('vehicles.addVehicle')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <TableFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                            statusOptions={[
                                { value: 'AVAILABLE', label: t('statuses.AVAILABLE') },
                                { value: 'IN_USE', label: t('statuses.IN_USE') },
                                { value: 'MAINTENANCE', label: t('statuses.MAINTENANCE') },
                            ]}
                            searchPlaceholder="Plaka veya model ara..."
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
                                                    onClick={() => handleSort('plateNumber')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('vehicles.plateNumber')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('model')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('vehicles.model')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('capacity')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('vehicles.capacity')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('status')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('drivers.status')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-right">{t('users.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredVehicles.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                    Sonuç bulunamadı
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredVehicles.map((vehicle) => (
                                                <TableRow key={vehicle.id}>
                                                    <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                                                    <TableCell>{vehicle.model}</TableCell>
                                                    <TableCell>{vehicle.capacity} kg</TableCell>
                                                    <TableCell>
                                                        <Badge variant={vehicle.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                                                            {t(`statuses.${vehicle.status}`)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleEdit(vehicle)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(vehicle.id)}
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

            <VehicleFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                vehicle={selectedVehicle}
            />
        </div>
    );
}
