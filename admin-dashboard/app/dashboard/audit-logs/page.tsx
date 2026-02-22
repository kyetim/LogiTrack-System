'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Search, Terminal, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues: any;
    newValues: any;
    ipAddress: string;
    createdAt: string;
    user: {
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
    } | null;
}

export default function AuditLogsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchLogs();
        }
    }, [user]);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            // Limit increased just to see more logs on the first page
            const { data } = await api.get('/audit-logs?limit=100');
            setLogs(data.data || []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            toast.error('İşlem geçmişi yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: "createdAt",
            header: "Tarih",
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"));
                return <div className="text-sm">{date.toLocaleString('tr-TR')}</div>
            },
        },
        {
            accessorKey: "user",
            header: "Kullanıcı",
            cell: ({ row }) => {
                const author = row.original.user;
                if (!author) return <span className="italic text-muted-foreground">Sistem / Misafir</span>;
                return <div className="font-semibold text-foreground">{author.email || author.id}</div>;
            }
        },
        {
            accessorKey: "action",
            header: "İşlem Tipi",
            cell: ({ row }) => {
                const action = row.getValue("action") as string;
                let variant: 'default' | 'success' | 'destructive' | 'warning' = 'default';
                if (action === 'CREATE') variant = 'success';
                else if (action === 'DELETE') variant = 'destructive';
                else if (action === 'UPDATE') variant = 'warning';
                else if (action === 'LOGIN') variant = 'default';

                return (
                    <StatusBadge
                        status={variant.toUpperCase()}
                        labels={{ [variant.toUpperCase()]: action }}
                        className={variant === 'success' ? 'bg-emerald-100 text-emerald-800' :
                            variant === 'destructive' ? 'bg-red-100 text-red-800' :
                                variant === 'warning' ? 'bg-amber-100 text-amber-800' :
                                    'bg-blue-100 text-blue-800'}
                    />
                );
            }
        },
        {
            accessorKey: "entityType",
            header: "Modül",
            cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("entityType")}</div>
        },
        {
            accessorKey: "ipAddress",
            header: "IP Adresi",
            cell: ({ row }) => <div className="text-xs text-muted-foreground">{row.getValue("ipAddress") || '-'}</div>
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <Button variant="outline" size="sm" onClick={() => setSelectedLog(row.original)} className="rounded-xl text-xs">
                        Detay <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                )
            }
        }
    ];

    if (authLoading || !user || user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">İşlem Geçmişi (Audit Logs)</h2>
                    <p className="text-gray-500">Sistem üzerindeki tüm değişiklikleri ve etkinlikleri izleyin.</p>
                </div>
            </div>

            <Card className="border-none shadow-soft hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
                    <CardTitle className="text-lg flex items-center text-gray-800">
                        <Terminal className="h-5 w-5 mr-2 text-gray-500" />
                        Aktivite Kayıtları
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={logs}
                        searchKey="entityType"
                        searchPlaceholder="Modül ara (örn: SHIPMENT)..."
                        filterColumn="action"
                        filterOptions={[
                            { value: 'CREATE', label: 'CREATE' },
                            { value: 'UPDATE', label: 'UPDATE' },
                            { value: 'DELETE', label: 'DELETE' },
                            { value: 'LOGIN', label: 'LOGIN' },
                        ]}
                    />
                </CardContent>
            </Card>

            {/* Log Detail Modal */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <History className="mr-2 h-5 w-5 text-primary" />
                            İşlem Detayları
                        </DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold text-gray-500 block">Kullanıcı:</span>
                                    <span>{selectedLog.user ? selectedLog.user.email : 'Sistem'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500 block">Tarih:</span>
                                    <span>{new Date(selectedLog.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500 block">İşlem:</span>
                                    <span>{selectedLog.action}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500 block">Modül / Hedef:</span>
                                    <span>{selectedLog.entityType} {selectedLog.entityId && `(#${selectedLog.entityId.substring(0, 8)})`}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-500 block">IP:</span>
                                    <span>{selectedLog.ipAddress || '-'}</span>
                                </div>
                            </div>

                            <hr />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-red-600">Eski Veri</h4>
                                    <pre className="text-xs bg-red-50 p-3 rounded-xl overflow-x-auto max-h-60 border border-red-100">
                                        {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : 'Veri yok.'}
                                    </pre>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-emerald-600">Yeni Veri / Payload</h4>
                                    <pre className="text-xs bg-emerald-50 p-3 rounded-xl overflow-x-auto max-h-60 border border-emerald-100">
                                        {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : 'Veri yok.'}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
