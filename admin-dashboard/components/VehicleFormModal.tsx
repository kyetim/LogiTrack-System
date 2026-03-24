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

interface VehicleFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: VehicleFormData) => Promise<void>;
    vehicle?: {
        id: string;
        plateNumber: string;
        model: string;
        capacity: number;
        status: string;
        mileage?: number;
    } | null;
}

export interface VehicleFormData {
    plateNumber: string;
    model: string;
    capacity: number;
    status: string;
    mileage?: number;
}

export function VehicleFormModal({ open, onClose, onSubmit, vehicle }: VehicleFormModalProps) {
    const t = useTranslations();
    const [formData, setFormData] = useState<VehicleFormData>({
        plateNumber: '',
        model: '',
        capacity: 1000,
        status: 'ACTIVE',
        mileage: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (vehicle) {
            setFormData({
                plateNumber: vehicle.plateNumber,
                model: vehicle.model,
                capacity: vehicle.capacity,
                status: vehicle.status,
                mileage: vehicle.mileage || 0,
            });
        } else {
            setFormData({
                plateNumber: '',
                model: '',
                capacity: 1000,
                status: 'ACTIVE',
                mileage: 0,
            });
        }
        setError('');
    }, [vehicle, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            console.error(err);
            setError(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{vehicle ? t('vehicles.editVehicle') : t('vehicles.addVehicle')}</DialogTitle>
                    <DialogDescription>
                        {vehicle ? 'Araç bilgilerini güncelleyin.' : 'Yeni bir araç ekleyin.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Plate Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="plateNumber">{t('vehicles.plateNumber')}</Label>
                            <Input
                                id="plateNumber"
                                type="text"
                                placeholder="34 ABC 1234"
                                value={formData.plateNumber}
                                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                required
                            />
                        </div>

                        {/* Model */}
                        <div className="grid gap-2">
                            <Label htmlFor="model">{t('vehicles.model')}</Label>
                            <Input
                                id="model"
                                type="text"
                                placeholder="Mercedes Sprinter"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                required
                            />
                        </div>

                        {/* Capacity */}
                        <div className="grid gap-2">
                            <Label htmlFor="capacity">{t('vehicles.capacity')} (kg)</Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                placeholder="1000"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>

                        {/* Mileage */}
                        <div className="grid gap-2">
                            <Label htmlFor="mileage">Kilometre (km)</Label>
                            <Input
                                id="mileage"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.mileage}
                                onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">{t('vehicles.status')}</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                                    <SelectItem value="MAINTENANCE">Bakımda</SelectItem>
                                    <SelectItem value="RETIRED">Emekli</SelectItem>
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
