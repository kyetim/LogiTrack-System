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
    shipment?: any | null;
    drivers: Array<{ id: string; user: { email: string } }>;
}

export interface ShipmentFormData {
    pickupLocation: {
        lat: number;
        lng: number;
        address: string;
    };
    deliveryLocation: {
        lat: number;
        lng: number;
        address: string;
    };
}

export function ShipmentFormModal({ open, onClose, onSubmit, shipment, drivers }: ShipmentFormModalProps) {
    const t = useTranslations();
    const [pickupAddress, setPickupAddress] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (shipment) {
            setPickupAddress(shipment.pickupLocation || '');
            setDeliveryAddress(shipment.deliveryLocation || '');
        } else {
            setPickupAddress('');
            setDeliveryAddress('');
        }
        setError('');
    }, [shipment, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!pickupAddress || !deliveryAddress) {
            setError(t('common.required'));
            return;
        }

        setIsLoading(true);
        try {
            // Create proper DTO format
            const formData: ShipmentFormData = {
                pickupLocation: {
                    lat: 41.0082, // Default Istanbul coordinates
                    lng: 28.9784,
                    address: pickupAddress,
                },
                deliveryLocation: {
                    lat: 39.9334, // Default Ankara coordinates
                    lng: 32.8597,
                    address: deliveryAddress,
                },
            };

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
                        Sevkiyat bilgilerini girin
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Pickup Address */}
                        <div className="grid gap-2">
                            <Label htmlFor="pickupAddress">Alış Adresi</Label>
                            <Input
                                id="pickupAddress"
                                type="text"
                                placeholder="İstanbul, Kadıköy..."
                                value={pickupAddress}
                                onChange={(e) => setPickupAddress(e.target.value)}
                                required
                            />
                        </div>

                        {/* Delivery Address */}
                        <div className="grid gap-2">
                            <Label htmlFor="deliveryAddress">Teslim Adresi</Label>
                            <Input
                                id="deliveryAddress"
                                type="text"
                                placeholder="Ankara, Çankaya..."
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                required
                            />
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
