'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
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
import api from '@/lib/api';
import { toast } from 'sonner';

interface Driver {
    id: string;
    userId: string;
    user: {
        email: string;
        id: string;
    };
    licenseNumber: string;
}

interface AssignDriverToVehicleModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vehicleId: string | null;
}

export function AssignDriverToVehicleModal({ open, onClose, onSuccess, vehicleId }: AssignDriverToVehicleModalProps) {
    const t = useTranslations();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDrivers, setIsFetchingDrivers] = useState(false);

    useEffect(() => {
        if (open) {
            fetchDrivers();
            setSelectedDriverId('');
        }
    }, [open]);

    const fetchDrivers = async () => {
        setIsFetchingDrivers(true);
        try {
            const { data } = await api.get('/drivers');
            // Allow any driver to be assigned, or maybe filter for those not assigned?
            // For now, list all. The backend might eventually enforce 1:1.
            setDrivers(data);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
            toast.error(t('common.error'));
        } finally {
            setIsFetchingDrivers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleId || !selectedDriverId) return;

        setIsLoading(true);
        try {
            await api.post(`/vehicles/${vehicleId}/drivers`, { driverId: selectedDriverId });
            toast.success('Sürücü atandı');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sürücü Ata</DialogTitle>
                    <DialogDescription>
                        Bu araca bir sürücü atayın.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="driverId">Sürücü</Label>
                            <Select
                                value={selectedDriverId}
                                onValueChange={setSelectedDriverId}
                                disabled={isFetchingDrivers}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isFetchingDrivers ? "Yükleniyor..." : "Sürücü seçin"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {drivers.map((driver) => (
                                        <SelectItem key={driver.userId} value={driver.userId}>
                                            {driver.user.email} - {driver.licenseNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isLoading || !selectedDriverId}>
                            {isLoading ? t('common.loading') : 'Ata'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
