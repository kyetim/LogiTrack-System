'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { DriverFormModal, DriverFormData } from '@/components/DriverFormModal';
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
import { Plus, Pencil, Trash2, ArrowUpDown, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { DriverDocumentsModal } from '@/components/DriverDocumentsModal';

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

type SortField = 'email' | 'licenseNumber' | 'status';
type SortOrder = 'asc' | 'desc';

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

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('email');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
            toast.error(t('common.error'));
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

    // Filtered and sorted drivers
    const filteredDrivers = useMemo(() => {
        let filtered = drivers;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(d =>
                d.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.phoneNumber.includes(searchTerm)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(d => d.status === statusFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue: any = sortField === 'email' ? a.user.email : a[sortField];
            let bValue: any = sortField === 'email' ? b.user.email : b[sortField];

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [drivers, searchTerm, statusFilter, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
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
                        <h1 className="text-2xl font-bold text-gray-900">{t('drivers.title')}</h1>
                        <p className="text-sm text-gray-600">{t('drivers.subtitle')}</p>
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
                        <CardTitle>{t('drivers.allDrivers')} ({filteredDrivers.length})</CardTitle>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('drivers.addDriver')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <TableFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                            statusOptions={[
                                { value: 'ON_DUTY', label: t('statuses.ON_DUTY') },
                                { value: 'OFF_DUTY', label: t('statuses.OFF_DUTY') },
                            ]}
                            searchPlaceholder="E-posta, ehliyet veya telefon ara..."
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
                                                    onClick={() => handleSort('email')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('users.email')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('licenseNumber')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('drivers.licenseNumber')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>{t('drivers.phoneNumber')}</TableHead>
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
                                        {filteredDrivers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                    Sonuç bulunamadı
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredDrivers.map((driver) => (
                                                <TableRow key={driver.id}>
                                                    <TableCell className="font-medium">{driver.user.email}</TableCell>
                                                    <TableCell>{driver.licenseNumber}</TableCell>
                                                    <TableCell>{driver.phoneNumber}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={driver.status === 'ON_DUTY' ? 'default' : 'secondary'}>
                                                            {t(`statuses.${driver.status}`)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleViewDocuments(driver)}
                                                                title={t('drivers.documents')}
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => handleEdit(driver)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(driver.id)}
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
