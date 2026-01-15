'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { UserFormModal, UserFormData } from '@/components/UserFormModal';
import { Pagination } from '@/components/Pagination';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, ArrowUpDown, Download, FileSpreadsheet, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel, exportToCSV, prepareDataForExport } from '@/lib/exportUtils';

interface User {
    id: string;
    email: string;
    role: string;
    createdAt: string;
}

type SortField = 'email' | 'role' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function UsersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Bulk operations
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/users');
            setUsers(data.data || data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    // Filtered and sorted users
    const filteredUsers = useMemo(() => {
        let filtered = users;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === 'createdAt') {
                aValue = new Date(aValue as string).getTime();
                bValue = new Date(bValue as string).getTime();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [users, searchTerm, roleFilter, sortField, sortOrder]);

    // Paginated users
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredUsers.slice(startIndex, endIndex);
    }, [filteredUsers, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleSubmit = async (data: UserFormData) => {
        try {
            if (selectedUser) {
                const payload: any = { email: data.email, role: data.role };
                if (data.password) {
                    payload.password = data.password;
                }
                await api.patch(`/users/${selectedUser.id}`, payload);
                toast.success(t('users.updateSuccess'));
            } else {
                await api.post('/users', data);
                toast.success(t('users.createSuccess'));
            }
            fetchUsers();
        } catch (error: any) {
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('users.deleteConfirm'))) return;

        try {
            await api.delete(`/users/${id}`);
            toast.success(t('users.deleteSuccess'));
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('users.deleteFailed'));
        }
    };

    const handleExportExcel = () => {
        const exportData = prepareDataForExport(filteredUsers, ['id']);
        exportToExcel(exportData, `users_${new Date().toISOString().split('T')[0]}`, 'Users');
        toast.success('Excel dosyası indirildi');
    };

    const handleExportCSV = () => {
        const exportData = prepareDataForExport(filteredUsers, ['id']);
        exportToCSV(exportData, `users_${new Date().toISOString().split('T')[0]}`);
        toast.success('CSV dosyası indirildi');
    };

    // Bulk operations
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(paginatedUsers.map(u => u.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`${selectedIds.length} kullanıcıyı silmek istediğinizden emin misiniz?`)) return;

        try {
            await Promise.all(selectedIds.map(id => api.delete(`/users/${id}`)));
            toast.success(`${selectedIds.length} kullanıcı silindi`);
            setSelectedIds([]);
            fetchUsers();
        } catch (error: any) {
            toast.error('Toplu silme başarısız oldu');
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
                        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
                        <p className="text-sm text-gray-600">{t('users.subtitle')}</p>
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
                        <CardTitle>{t('users.allUsers')} ({filteredUsers.length})</CardTitle>
                        <div className="flex gap-2">
                            {selectedIds.length > 0 && (
                                <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                                    <Trash className="h-4 w-4 mr-2" />
                                    Seçilenleri Sil ({selectedIds.length})
                                </Button>
                            )}
                            <Button onClick={handleExportExcel} variant="outline" size="sm">
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Excel
                            </Button>
                            <Button onClick={handleExportCSV} variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                            </Button>
                            <Button onClick={handleCreate}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t('users.addUser')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TableFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            roleFilter={roleFilter}
                            onRoleFilterChange={setRoleFilter}
                            roleOptions={[
                                { value: 'ADMIN', label: t('roles.ADMIN') },
                                { value: 'DISPATCHER', label: t('roles.DISPATCHER') },
                                { value: 'DRIVER', label: t('roles.DRIVER') },
                            ]}
                            searchPlaceholder="E-posta ara..."
                        />

                        {isLoading ? (
                            <div className="text-center py-8">{t('common.loading')}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </TableHead>
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
                                                    onClick={() => handleSort('role')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('users.role')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort('createdAt')}
                                                    className="hover:bg-transparent"
                                                >
                                                    {t('users.createdAt')}
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-right">{t('users.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                    Sonuç bulunamadı
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedIds.includes(user.id)}
                                                            onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                            {t(`roles.${user.role}`)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(user.id)}
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

                        {/* Pagination */}
                        {!isLoading && filteredUsers.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                totalItems={filteredUsers.length}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                            />
                        )}
                    </CardContent>
                </Card>
            </main>

            <UserFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                user={selectedUser}
            />
        </div>
    );
}
