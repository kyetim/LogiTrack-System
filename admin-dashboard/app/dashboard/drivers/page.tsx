'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { DriverFormModal, DriverFormData } from '@/components/DriverFormModal';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, FileText, Truck, UserCheck, Clock, MoreHorizontal, Download, WifiOff } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import { useWebSocket } from '@/hooks/useWebSocket';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Driver {
    id: string;
    userId: string;
    user: {
        email: string;
    };
    licenseNumber: string;
    phoneNumber: string;
    status: string;
    isAvailable: boolean;
    createdAt: string;
    lastLocationUpdate?: string | null;
}

interface PendingDriver {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    createdAt: string;
    driverProfile: {
        id: string;
        licenseNumber: string;
    };
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
    const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [docsModalOpen, setDocsModalOpen] = useState(false);
    const [docsDriver, setDocsDriver] = useState<{ id: string; name: string } | null>(null);
    const { socket } = useWebSocket();

    useEffect(() => {
        if (socket) {
            socket.on('location:update', (data: any) => {
                if (data.driver) {
                    setDrivers(prev => prev.map(d => {
                        if (d.id === data.driver.id) {
                            return {
                                ...d,
                                status: data.driver.status,
                                isAvailable: data.driver.isAvailable,
                                lastLocationUpdate: data.timestamp ?? data.driver.lastLocationUpdate,
                            };
                        }
                        return d;
                    }));
                }
            });

            return () => {
                socket.off('location:update');
            };
        }
    }, [socket]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchDrivers();
            fetchPendingDrivers();
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
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingDrivers = async () => {
        try {
            const { data } = await api.get('/users/pending-drivers');
            setPendingDrivers(data);
        } catch (error) {
            console.error('Failed to fetch pending drivers:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            const driverUsers = (data.data || data).filter((u: User) => u.role === 'DRIVER');
            setUsers(users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/drivers/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'drivers.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Excel dosyası başarıyla indirildi.');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Excel indirme başarısız oldu.');
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

    const handleApprove = async (driverId: string) => {
        try {
            await api.patch(`/users/${driverId}/approve`);
            toast.success('Şoför başarıyla onaylandı. Email gönderildi.');
            fetchPendingDrivers();
            fetchDrivers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Onaylama başarısız oldu.');
        }
    };

    const handleReject = async (driverId: string) => {
        if (!confirm('Bu başvuruyu reddetmek istediğinize emin misiniz?')) return;
        try {
            await api.patch(`/users/${driverId}/reject`, { reason: 'Admin tarafından reddedildi' });
            toast.success('Başvuru reddedildi. Email gönderildi.');
            fetchPendingDrivers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Reddetme başarısız oldu.');
        }
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

    // DB değerlerini (status + isAvailable) görünen etikete dönüştür
    // OFF_DUTY              → 'OFF_DUTY'  → "Çevrimdışı"
    // ON_DUTY + available   → 'AVAILABLE' → "Müsait"
    // ON_DUTY + !available  → 'ON_DUTY'   → "Görevde"
    const getDisplayStatus = (driver: Driver) => {
        if (driver.status === 'OFF_DUTY') return 'OFF_DUTY';
        if (driver.status === 'ON_DUTY') {
            return driver.isAvailable ? 'AVAILABLE' : 'ON_DUTY';
        }
        return driver.status;
    };

    const columns: ColumnDef<Driver>[] = [
        {
            accessorKey: "user.email",
            id: "email",
            header: t('users.email'),
            cell: ({ row }) => {
                const driver = row.original;
                const isOnDuty = driver.status === 'ON_DUTY';
                const hasStaleLocation = isOnDuty && (
                    !driver.lastLocationUpdate ||
                    Date.now() - new Date(driver.lastLocationUpdate).getTime() > 5 * 60 * 1000
                );
                return (
                    <div className="flex items-center gap-2">
                        <div className="font-semibold text-foreground">{driver.user.email}</div>
                        {hasStaleLocation && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                <WifiOff className="h-3 w-3" />
                                Konum Yok
                            </span>
                        )}
                    </div>
                );
            },
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
            id: "status",
            accessorFn: (row) => getDisplayStatus(row),
            header: t('drivers.status'),
            cell: ({ row }) => {
                const displayStatus = getDisplayStatus(row.original);
                return (
                    <StatusBadge
                        status={displayStatus}
                        labels={{
                            'ON_DUTY': t('statuses.ON_DUTY'),       // Görevde
                            'OFF_DUTY': t('statuses.OFF_DUTY'),     // Çevrimdışı
                            'AVAILABLE': t('statuses.AVAILABLE'),   // Müsait
                        }}
                    />
                );
            },
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

    const pendingColumns: ColumnDef<PendingDriver>[] = [
        {
            accessorKey: "firstName",
            header: "Ad Soyad",
            cell: ({ row }) => <div className="font-semibold">{row.original.firstName} {row.original.lastName}</div>,
        },
        {
            accessorKey: "email",
            header: "E-posta",
        },
        {
            accessorKey: "phoneNumber",
            header: "Telefon",
        },
        {
            accessorKey: "driverProfile.licenseNumber",
            header: "Ehliyet No",
            cell: ({ row }) => <div className="font-mono text-xs">{row.original.driverProfile.licenseNumber}</div>,
        },
        {
            accessorKey: "createdAt",
            header: "Başvuru Tarihi",
            cell: ({ row }) => <div className="text-sm">{new Date(row.original.createdAt).toLocaleDateString('tr-TR')}</div>,
        },
        {
            id: "actions",
            header: "Aksiyon",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(row.original.id)} className="bg-green-600 hover:bg-green-700">Onayla</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(row.original.id)}>Reddet</Button>
                </div>
            )
        }
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
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} className="rounded-2xl shadow-sm border-primary/20 hover:bg-primary/5 text-primary">
                        <Download className="h-4 w-4 mr-2" />
                        Excel İndir
                    </Button>
                    <Button onClick={handleCreate} className="rounded-2xl shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('drivers.addDriver')}
                    </Button>
                </div>
            </div>

            {/* Summary Cards — 4 kart: Toplam / Görevde / Müsait / Çevrimdışı */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                        <div className="text-2xl font-bold">
                            {drivers.filter(d => d.status === 'ON_DUTY' && !d.isAvailable).length}
                        </div>
                        <p className="text-xs text-secondary-foreground/80 mt-1 opacity-80">Aktif teslimat yapan</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-accent to-accent/90 text-accent-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-accent-foreground/90">
                            Müsait
                        </CardTitle>
                        <Clock className="h-4 w-4 text-accent-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {drivers.filter(d => d.status === 'ON_DUTY' && d.isAvailable).length}
                        </div>
                        <p className="text-xs text-accent-foreground/80 mt-1 opacity-80">Görev bekleyen</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-slate-600 to-slate-700 text-white transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">
                            Çevrimdışı
                        </CardTitle>
                        <WifiOff className="h-4 w-4 text-white/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {drivers.filter(d => d.status === 'OFF_DUTY').length}
                        </div>
                        <p className="text-xs text-white/80 mt-1 opacity-80">Mesai dışı</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="active">
                        Aktif Sürücüler
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Onay Bekleyenler
                        {pendingDrivers.length > 0 && (
                            <Badge variant="destructive" className="ml-2 px-1.5 py-0 min-w-5">
                                {pendingDrivers.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    <DataTable
                        columns={columns}
                        data={drivers}
                        searchKey="email"
                        searchPlaceholder="E-posta ara..."
                        filterColumn="status"
                        filterOptions={[
                            { value: 'AVAILABLE', label: t('statuses.AVAILABLE') },
                            { value: 'ON_DUTY', label: t('statuses.ON_DUTY') },
                            { value: 'OFF_DUTY', label: t('statuses.OFF_DUTY') },
                        ]}
                    />
                </TabsContent>

                <TabsContent value="pending">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <DataTable
                            columns={pendingColumns}
                            data={pendingDrivers}
                            searchKey="email"
                            searchPlaceholder="E-posta ara..."
                        />
                    </div>
                </TabsContent>
            </Tabs>

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
