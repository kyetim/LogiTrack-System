'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { VehicleFormModal, VehicleFormData } from '@/components/VehicleFormModal';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, ArrowUpDown, Wrench, UserPlus, Truck, CheckCircle, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { MaintenanceHistoryDialog } from '@/components/MaintenanceHistoryDialog';
import { AssignDriverToVehicleModal } from '@/components/AssignDriverToVehicleModal';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/StatusBadge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
            // toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
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

    // Columns
    const columns: ColumnDef<Vehicle>[] = [
        {
            accessorKey: "plateNumber",
            header: t('vehicles.plateNumber'),
            cell: ({ row }) => <div className="font-bold text-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 tracking-wider inline-block">{row.getValue("plateNumber")}</div>,
        },
        {
            accessorKey: "model",
            header: t('vehicles.model'),
            cell: ({ row }) => <div className="font-medium">{row.getValue("model")}</div>,
        },
        {
            accessorKey: "capacity",
            header: t('vehicles.capacity'),
            cell: ({ row }) => <div>{row.getValue("capacity")} kg</div>,
        },
        {
            accessorKey: "mileage",
            header: "Kilometre",
            cell: ({ row }) => <div>{row.original.mileage || 0} km</div>,
        },
        {
            accessorKey: "status",
            header: t('drivers.status'),
            cell: ({ row }) => (
                <StatusBadge
                    status={row.getValue("status")}
                    labels={{
                        'ACTIVE': 'Aktif',
                        'MAINTENANCE': 'Bakımda',
                        'RETIRED': 'Emekli'
                    }}
                />
            ),
        },
        {
            id: "drivers",
            header: "Sürücüler",
            cell: ({ row }) => {
                const drivers = row.original.drivers;
                return (drivers && drivers.length > 0) ? (
                    <div className="flex -space-x-2">
                        {drivers.map(d => (
                            <div key={d.id} className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] border border-white" title={d.user.email}>
                                {d.user.email.charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>
                ) : <span className="text-muted-foreground text-xs italic">Yok</span>
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const vehicle = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAssignDriver(vehicle.id)}>
                                <UserPlus className="mr-2 h-4 w-4" /> Sürücü Ata
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMaintenance(vehicle.id)}>
                                <Wrench className="mr-2 h-4 w-4" /> Bakım Geçmişi
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                                <Pencil className="mr-2 h-4 w-4" /> Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(vehicle.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Sil
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">{t('vehicles.title')}</h2>
                    <p className="text-gray-500">{t('vehicles.subtitle')}</p>
                </div>
                <Button onClick={handleCreate} className="rounded-2xl shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('vehicles.addVehicle')}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">
                            Toplam Araç
                        </CardTitle>
                        <Truck className="h-4 w-4 text-primary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicles.length}</div>
                        <p className="text-xs text-primary-foreground/80 mt-1 opacity-80">Filodaki toplam araç</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-foreground/90">
                            Aktif Araçlar
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-secondary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'ACTIVE').length}</div>
                        <p className="text-xs text-secondary-foreground/80 mt-1 opacity-80">Şu an kullanımda</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-destructive to-destructive/90 text-white transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">
                            Bakımda / Arızalı
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-white/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'MAINTENANCE').length}</div>
                        <p className="text-xs text-white/80 mt-1 opacity-80">Servis durumunda</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={vehicles}
                searchKey="plateNumber"
                searchPlaceholder="Plaka ara..."
                filterColumn="status"
                filterOptions={[
                    { value: 'ACTIVE', label: 'Aktif' },
                    { value: 'MAINTENANCE', label: 'Bakımda' },
                    { value: 'RETIRED', label: 'Emekli' },
                ]}
            />

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
