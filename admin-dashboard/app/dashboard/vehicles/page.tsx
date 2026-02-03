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
import { Plus, Pencil, Trash2, ArrowUpDown, Wrench, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { MaintenanceHistoryDialog } from '@/components/MaintenanceHistoryDialog';
import { AssignDriverToVehicleModal } from '@/components/AssignDriverToVehicleModal';

interface Vehicle {
    id: string;
    plateNumber: string;
    model: string;
    capacity: number;
    status: string;
    mileage?: number;
    drivers?: Array<{
        id: string;
        user: { email: string };
    }>;
    createdAt: string;
}

// ... imports and interfaces ...

export default function VehiclesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Maintenance Modal State
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [maintenanceVehicleId, setMaintenanceVehicleId] = useState<string | null>(null);

    // Assign Driver Modal State
    const [assignDriverModalOpen, setAssignDriverModalOpen] = useState(false);
    const [assignDriverVehicleId, setAssignDriverVehicleId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<keyof Vehicle>('plateNumber');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleMaintenance = (vehicleId: string) => {
        setMaintenanceVehicleId(vehicleId);
        setMaintenanceModalOpen(true);
    };

    const handleAssignDriver = (vehicleId: string) => {
        setAssignDriverVehicleId(vehicleId);
        setAssignDriverModalOpen(true);
    };

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
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue === undefined || bValue === undefined) return 0;

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [vehicles, searchTerm, statusFilter, sortField, sortOrder]);

    const handleSort = (field: keyof Vehicle) => {
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

    const handleDelete = async (id: string) => {
        if (!confirm(t('common.deleteConfirm'))) return;

        try {
            await api.delete(`/vehicles/${id}`);
            toast.success(t('common.deleteSuccess'));
            fetchVehicles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('common.deleteFailed'));
        }
    };

    const handleSubmit = async (data: VehicleFormData) => {
        try {
            if (selectedVehicle) {
                await api.patch(`/vehicles/${selectedVehicle.id}`, data);
                toast.success('Araç güncellendi');
            } else {
                await api.post('/vehicles', data);
                toast.success('Araç oluşturuldu');
            }
            fetchVehicles();
            setModalOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('common.error'));
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
                                { value: 'ACTIVE', label: 'Aktif' },
                                { value: 'MAINTENANCE', label: 'Bakımda' },
                                { value: 'RETIRED', label: 'Emekli' },
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
                                                Kilometre
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
                                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                    Sonuç bulunamadı
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredVehicles.map((vehicle) => (
                                                <TableRow key={vehicle.id}>
                                                    <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                                                    <TableCell>{vehicle.model}</TableCell>
                                                    <TableCell>{vehicle.capacity} kg</TableCell>
                                                    <TableCell>{vehicle.mileage || 0} km</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            vehicle.status === 'ACTIVE' ? 'default' :
                                                                vehicle.status === 'MAINTENANCE' ? 'destructive' : 'secondary'
                                                        }>
                                                            {vehicle.status === 'ACTIVE' ? 'Aktif' :
                                                                vehicle.status === 'MAINTENANCE' ? 'Bakımda' : 'Emekli'}
                                                        </Badge>
                                                        {vehicle.drivers && vehicle.drivers.length > 0 && (
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                {vehicle.drivers.map(d => d.user.email).join(', ')}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAssignDriver(vehicle.id)}
                                                                title="Sürücü Ata"
                                                            >
                                                                <UserPlus className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleMaintenance(vehicle.id)}
                                                                title="Bakım Geçmişi"
                                                            >
                                                                <Wrench className="h-4 w-4" />
                                                            </Button>
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

            <MaintenanceHistoryDialog
                open={maintenanceModalOpen}
                onClose={() => setMaintenanceModalOpen(false)}
                vehicleId={maintenanceVehicleId}
            />

            <AssignDriverToVehicleModal
                open={assignDriverModalOpen}
                onClose={() => setAssignDriverModalOpen(false)}
                onSuccess={fetchVehicles}
                vehicleId={assignDriverVehicleId}
            />
        </div>
    );
}
