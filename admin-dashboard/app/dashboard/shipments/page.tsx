'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { ShipmentFormModal, ShipmentFormData } from '@/components/ShipmentFormModal';
import { AssignDriverModal } from '@/components/AssignDriverModal';
import { DeliveryProofModal } from '@/components/DeliveryProofModal';
import { WaybillUploadModal } from '@/components/WaybillUploadModal';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, Truck, CheckCircle, Plus, MoreHorizontal, Pencil, Trash2, Upload, MapPin, Download } from 'lucide-react';
import { toast } from 'sonner';
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

interface Shipment {
    id: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    status: string;
    driverId?: string;
    driver?: {
        id: string;
        email: string;
    };
    createdAt: string;
}

interface Driver {
    id: string;
    user: {
        id: string;
        email: string;
    };
}

export default function ShipmentsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedShipmentForAssign, setSelectedShipmentForAssign] = useState<Shipment | null>(null);
    const [podModalOpen, setPodModalOpen] = useState(false);
    const [selectedShipmentForPod, setSelectedShipmentForPod] = useState<string | null>(null);
    const [waybillModalOpen, setWaybillModalOpen] = useState(false);
    const [selectedShipmentForWaybill, setSelectedShipmentForWaybill] = useState<string | null>(null);

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
            setShipments(data.data || data);
        } catch (error) {
            console.error('Failed to fetch shipments:', error);
            // Don't show toast on initial load error if it's just empty or network blip
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const { data } = await api.get('/drivers');
            setDrivers(data.data || data);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
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

    const handleExport = async () => {
        try {
            const response = await api.get('/shipments/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'shipments.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Excel dosyası başarıyla indirildi.');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Excel indirme başarısız oldu.');
        }
    };

    const handleAssignDriver = (shipment: Shipment) => {
        setSelectedShipmentForAssign(shipment);
        setAssignModalOpen(true);
    };

    const handleAssignSubmit = async (driverId: string) => {
        if (!selectedShipmentForAssign) return;

        try {
            await api.patch(`/shipments/${selectedShipmentForAssign.id}/assign`, { driverId });
            toast.success('Sürücü atandı');
            fetchShipments();
            setAssignModalOpen(false);
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

    // Define Columns
    const columns: ColumnDef<Shipment>[] = [
        {
            accessorKey: "trackingNumber",
            header: t('shipments.trackingNumber'),
            cell: ({ row }) => <div className="font-bold text-foreground">{row.getValue("trackingNumber")}</div>,
        },
        {
            accessorKey: "origin",
            header: t('shipments.origin'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                    {row.getValue("origin")}
                </div>
            ),
        },
        {
            accessorKey: "destination",
            header: t('shipments.destination'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-secondary" />
                    {row.getValue("destination")}
                </div>
            ),
        },
        {
            accessorKey: "driver",
            header: t('shipments.assignedDriver'),
            cell: ({ row }) => {
                const driver = row.original.driver;
                return driver ? (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {driver.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-muted-foreground">{driver.email}</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground italic">Atanmamış</span>
                );
            },
        },
        {
            accessorKey: "status",
            header: t('shipments.status'),
            cell: ({ row }) => (
                <StatusBadge
                    status={row.getValue("status")}
                    labels={{
                        'PENDING': t('statuses.PENDING'),
                        'IN_TRANSIT': t('statuses.IN_TRANSIT'),
                        'DELIVERED': t('statuses.DELIVERED'),
                        'CANCELLED': t('statuses.CANCELLED')
                    }}
                />
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const shipment = row.original;
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
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(shipment.trackingNumber)}
                            >
                                Kopyala (Takip No)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(shipment)}>
                                <Pencil className="mr-2 h-4 w-4" /> Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignDriver(shipment)}>
                                <Truck className="mr-2 h-4 w-4" /> Sürücü Ata
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setSelectedShipmentForWaybill(shipment.id);
                                setWaybillModalOpen(true);
                            }}>
                                <Upload className="mr-2 h-4 w-4" /> İrsaliye Yükle
                            </DropdownMenuItem>

                            {shipment.status === 'DELIVERED' && (
                                <DropdownMenuItem onClick={() => {
                                    setSelectedShipmentForPod(shipment.id);
                                    setPodModalOpen(true);
                                }}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> View POD
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(shipment.id)} className="text-destructive focus:text-destructive">
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
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">{t('shipments.title')}</h2>
                    <p className="text-gray-500">{t('shipments.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} className="rounded-2xl shadow-sm border-primary/20 hover:bg-primary/5 text-primary">
                        <Download className="h-4 w-4 mr-2" />
                        Excel İndir
                    </Button>
                    <Button onClick={handleCreate} className="rounded-2xl shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('shipments.addShipment')}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">
                            Toplam
                        </CardTitle>
                        <Package className="h-4 w-4 text-primary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shipments.length}</div>
                        <p className="text-xs text-primary-foreground/80 mt-1 opacity-80">Tüm sevkiyatlar</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-accent to-accent/90 text-accent-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-accent-foreground/90">
                            Bekleyen
                        </CardTitle>
                        <Clock className="h-4 w-4 text-accent-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shipments.filter(s => s.status === 'PENDING').length}</div>
                        <p className="text-xs text-accent-foreground/80 mt-1 opacity-80">Atama bekliyor</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-foreground/90">
                            Yolda
                        </CardTitle>
                        <Truck className="h-4 w-4 text-secondary-foreground/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shipments.filter(s => s.status === 'IN_TRANSIT').length}</div>
                        <p className="text-xs text-secondary-foreground/80 mt-1 opacity-80">Teslimata giden</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-gradient-to-br from-[#3A4F41] to-[#2E5B43] text-white transform hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">
                            Teslim Edildi
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-white/90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shipments.filter(s => s.status === 'DELIVERED').length}</div>
                        <p className="text-xs text-white/80 mt-1 opacity-80">Tamamlanan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={shipments}
                searchKey="trackingNumber"
                searchPlaceholder="Takip numarası ara..."
                filterColumn="status"
                filterOptions={[
                    { value: 'PENDING', label: t('statuses.PENDING') },
                    { value: 'IN_TRANSIT', label: t('statuses.IN_TRANSIT') },
                    { value: 'DELIVERED', label: t('statuses.DELIVERED') },
                    { value: 'CANCELLED', label: t('statuses.CANCELLED') },
                ]}
            />

            <ShipmentFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                shipment={selectedShipment}
                drivers={drivers}
            />

            <AssignDriverModal
                open={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                onSubmit={handleAssignSubmit}
                drivers={drivers}
                currentDriverId={selectedShipmentForAssign?.driverId}
            />
            <DeliveryProofModal
                shipmentId={selectedShipmentForPod}
                isOpen={podModalOpen}
                onClose={() => {
                    setPodModalOpen(false);
                    setSelectedShipmentForPod(null);
                }}
            />

            <WaybillUploadModal
                shipmentId={selectedShipmentForWaybill}
                open={waybillModalOpen}
                onClose={() => {
                    setWaybillModalOpen(false);
                    setSelectedShipmentForWaybill(null);
                }}
            />
        </div>
    );
}
