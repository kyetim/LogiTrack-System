'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { DriverFormModal, DriverFormData } from '@/components/DriverFormModal';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, FileText, Truck, UserCheck, Clock, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { DriverDocumentsModal } from '@/components/DriverDocumentsModal';
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

interface Driver {
    id: string;
    userId: string;
    user: {
        email: string;
    };
    licenseNumber: string;
    phoneNumber: string;
    status: string;
    createdAt: string;
}

interface User {
    id: string;
    email: string;
    role: string;
}

export default function DriversPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [docsModalOpen, setDocsModalOpen] = useState(false);
    const [docsDriver, setDocsDriver] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchDrivers();
            fetchUsers();
        }
    }, [user]);

    const fetchDrivers = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/drivers');
            setDrivers(data);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
            // toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            const driverUsers = (data.data || data).filter((u: User) => u.role === 'DRIVER');
            setUsers(driverUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleCreate = () => {
        setSelectedDriver(null);
        setModalOpen(true);
    };

    const handleEdit = (driver: Driver) => {
        setSelectedDriver(driver);
        setModalOpen(true);
    };

    const handleViewDocuments = (driver: Driver) => {
        setDocsDriver({ id: driver.id, name: driver.user.email });
        setDocsModalOpen(true);
    };

    const handleSubmit = async (data: DriverFormData) => {
        try {
            if (selectedDriver) {
                await api.patch(`/drivers/${selectedDriver.id}`, data);
                toast.success(t('users.updateSuccess'));
            } else {
                await api.post('/drivers', data);
                toast.success(t('users.createSuccess'));
            }
            fetchDrivers();
        } catch (error: any) {
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('users.deleteConfirm'))) return;

        try {
            await api.delete(`/drivers/${id}`);
            toast.success(t('users.deleteSuccess'));
            fetchDrivers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('users.deleteFailed'));
        }
    };

    // Columns
    const columns: ColumnDef<Driver>[] = [
        {
            accessorKey: "user.email",
            id: "email",
            header: t('users.email'),
            cell: ({ row }) => <div className="font-semibold text-foreground">{row.original.user.email}</div>,
        },
        {
            accessorKey: "licenseNumber",
            header: t('drivers.licenseNumber'),
            cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("licenseNumber")}</div>,
        },
        {
            accessorKey: "phoneNumber",
            header: t('drivers.phoneNumber'),
            cell: ({ row }) => <div className="text-sm">{row.getValue("phoneNumber")}</div>,
        },
        {
            accessorKey: "status",
            header: t('drivers.status'),
            cell: ({ row }) => (
                <StatusBadge
                    status={row.getValue("status")}
                    labels={{
                        'ON_DUTY': t('statuses.ON_DUTY'),
                        'OFF_DUTY': t('statuses.OFF_DUTY')
                    }}
                />
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const driver = row.original;
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
                            <DropdownMenuItem onClick={() => handleViewDocuments(driver)}>
                                <FileText className="mr-2 h-4 w-4" /> {t('drivers.documents')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(driver)}>
                                <Pencil className="mr-2 h-4 w-4" /> Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(driver.id)} className="text-destructive focus:text-destructive">
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
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">{t('drivers.title')}</h2>
                    <p className="text-gray-500">{t('drivers.subtitle')}</p>
                </div>
                <Button onClick={handleCreate} className="rounded-2xl shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('drivers.addDriver')}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">
                            Toplam Sürücü
                        </CardTitle>
                        <Truck className="h-4 w-4 text-primary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drivers.length}</div>
                        <p className="text-xs text-primary-foreground/80 mt-1 opacity-80">Kayıtlı sürücü sayısı</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-foreground/90">
                            Görevde
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-secondary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drivers.filter(d => d.status === 'ON_DUTY').length}</div>
                        <p className="text-xs text-secondary-foreground/80 mt-1 opacity-80">Şu an aktif çalışan</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-accent to-accent/90 text-accent-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-accent-foreground/90">
                            Müsait / İzinli
                        </CardTitle>
                        <Clock className="h-4 w-4 text-accent-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drivers.filter(d => d.status !== 'ON_DUTY').length}</div>
                        <p className="text-xs text-accent-foreground/80 mt-1 opacity-80">Görev bekleyen</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={drivers}
                searchKey="email" // Nested accessor search might need custom handling or just use email if flattened
                searchPlaceholder="E-posta ara..."
                filterColumn="status"
                filterOptions={[
                    { value: 'ON_DUTY', label: t('statuses.ON_DUTY') },
                    { value: 'OFF_DUTY', label: t('statuses.OFF_DUTY') },
                ]}
            />

            <DriverFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                driver={selectedDriver}
                users={users}
            />

            <DriverDocumentsModal
                open={docsModalOpen}
                onClose={() => setDocsModalOpen(false)}
                driverId={docsDriver?.id || null}
                driverName={docsDriver?.name || ''}
            />
        </div>
    );
}
