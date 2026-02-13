'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { UserFormModal, UserFormData } from '@/components/UserFormModal';
import { Pagination } from '@/components/Pagination';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Download, FileSpreadsheet, Trash, Users, Shield, UserCheck, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel, exportToCSV, prepareDataForExport } from '@/lib/exportUtils';
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

interface User {
    id: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function UsersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
            // Don't show toast on initial load error if it's just empty or network blip
        } finally {
            setIsLoading(false);
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

    // Columns
    const columns: ColumnDef<User>[] = [
        {
            accessorKey: "email",
            header: t('users.email'),
            cell: ({ row }) => <div className="font-semibold text-foreground">{row.getValue("email")}</div>,
        },
        {
            accessorKey: "role",
            header: t('users.role'),
            cell: ({ row }) => (
                <StatusBadge
                    status={row.getValue("role")}
                    labels={{
                        'ADMIN': t('roles.ADMIN'),
                        'DISPATCHER': t('roles.DISPATCHER'),
                        'DRIVER': t('roles.DRIVER')
                    }}
                />
            ),
        },
        {
            accessorKey: "createdAt",
            header: t('users.createdAt'),
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"));
                return <div className="text-muted-foreground text-xs">{date.toLocaleDateString('tr-TR')}</div>
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original;
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
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" /> Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-destructive focus:text-destructive">
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
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">{t('users.title')}</h2>
                    <p className="text-gray-500">{t('users.subtitle')}</p>
                </div>
                <Button onClick={handleCreate} className="rounded-2xl shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('users.addUser')}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">
                            Toplam Kullanıcı
                        </CardTitle>
                        <Users className="h-4 w-4 text-primary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-primary-foreground/80 mt-1 opacity-80">Sistemdeki toplam kayıt</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-foreground/90">
                            Yöneticiler
                        </CardTitle>
                        <Shield className="h-4 w-4 text-secondary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</div>
                        <p className="text-xs text-secondary-foreground/80 mt-1 opacity-80">Tam yetkili personel</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-accent to-accent/90 text-accent-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-accent-foreground/90">
                            Sürücüler
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-accent-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'DRIVER').length}</div>
                        <p className="text-xs text-accent-foreground/80 mt-1 opacity-80">Sahadaki personel</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={users}
                searchKey="email"
                searchPlaceholder="E-posta ara..."
                filterColumn="role"
                filterOptions={[
                    { value: 'ADMIN', label: t('roles.ADMIN') },
                    { value: 'DISPATCHER', label: t('roles.DISPATCHER') },
                    { value: 'DRIVER', label: t('roles.DRIVER') },
                ]}
            />

            <UserFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                user={selectedUser}
            />
        </div>
    );
}
