'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ShipmentFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ShipmentFormData) => Promise<void>;
    shipment?: {
        id: string;
        trackingNumber: string;
        origin: string;
        destination: string;
        driverId?: string;
        status: string;
    } | null;
    drivers: Array<{ id: string; user: { email: string } }>;
}

export interface ShipmentFormData {
    trackingNumber: string;
    origin: string;
    destination: string;
    driverId?: string;
    status: string;
}

export function ShipmentFormModal({ open, onClose, onSubmit, shipment, drivers }: ShipmentFormModalProps) {
    const t = useTranslations();
    const [formData, setFormData] = useState<ShipmentFormData>({
        trackingNumber: '',
        origin: '',
        destination: '',
        driverId: undefined,
        status: 'PENDING',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (shipment) {
            setFormData({
                trackingNumber: shipment.trackingNumber,
                origin: shipment.origin,
                destination: shipment.destination,
                driverId: shipment.driverId,
                status: shipment.status,
            });
        } else {
            setFormData({
                trackingNumber: `TRK${Date.now()}`,
                origin: '',
                destination: '',
                driverId: undefined,
                status: 'PENDING',
            });
        }
        setError('');
    }, [shipment, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.trackingNumber || !formData.origin || !formData.destination) {
            setError(t('common.required'));
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {shipment ? t('shipments.editShipment') : t('shipments.addShipment')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('shipments.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Tracking Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="trackingNumber">{t('shipments.trackingNumber')}</Label>
                            <Input
                                id="trackingNumber"
                                type="text"
                                value={formData.trackingNumber}
                                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                                required
                            />
                        </div>

                        {/* Origin */}
                        <div className="grid gap-2">
                            <Label htmlFor="origin">{t('shipments.origin')}</Label>
                            <Input
                                id="origin"
                                type="text"
                                placeholder="İstanbul"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                required
                            />
                        </div>

                        {/* Destination */}
                        <div className="grid gap-2">
                            <Label htmlFor="destination">{t('shipments.destination')}</Label>
                            <Input
                                id="destination"
                                type="text"
                                placeholder="Ankara"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                required
                            />
                        </div>

                        {/* Driver Assignment */}
                        <div className="grid gap-2">
                            <Label htmlFor="driverId">{t('shipments.assignedDriver')}</Label>
                            <Select
                                value={formData.driverId || 'none'}
                                onValueChange={(value) => setFormData({ ...formData, driverId: value === 'none' ? undefined : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sürücü seçin (opsiyonel)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Atanmadı</SelectItem>
                                    {drivers.map((driver) => (
                                        <SelectItem key={driver.id} value={driver.id}>
                                            {driver.user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">{t('shipments.status')}</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">{t('statuses.PENDING')}</SelectItem>
                                    <SelectItem value="IN_TRANSIT">{t('statuses.IN_TRANSIT')}</SelectItem>
                                    <SelectItem value="DELIVERED">{t('statuses.DELIVERED')}</SelectItem>
                                    <SelectItem value="CANCELLED">{t('statuses.CANCELLED')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500">{error}</div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('common.loading') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
