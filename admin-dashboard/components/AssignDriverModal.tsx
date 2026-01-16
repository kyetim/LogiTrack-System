'use client';

import { useState } from 'react';
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

interface AssignDriverModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (driverId: string) => Promise<void>;
    drivers: Array<{ id: string; user: { id: string; email: string } }>;
    currentDriverId?: string;
}

export function AssignDriverModal({ open, onClose, onSubmit, drivers, currentDriverId }: AssignDriverModalProps) {
    const t = useTranslations();
    const [selectedDriverId, setSelectedDriverId] = useState<string>(currentDriverId || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedDriverId) {
            setError('Lütfen bir sürücü seçin');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(selectedDriverId);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Atama başarısız');
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
                        Bu sevkiyata bir sürücü atayın
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="driverId">Sürücü</Label>
                            <Select
                                value={selectedDriverId}
                                onValueChange={setSelectedDriverId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sürücü seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {drivers.map((driver) => (
                                        <SelectItem key={driver.id} value={driver.user.id}>
                                            {driver.user.email}
                                        </SelectItem>
                                    ))}
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
                            {isLoading ? t('common.loading') : 'Ata'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
