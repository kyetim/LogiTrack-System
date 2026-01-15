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

interface DriverFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: DriverFormData) => Promise<void>;
    driver?: {
        id: string;
        userId: string;
        licenseNumber: string;
        phoneNumber: string;
        status: string;
    } | null;
    users: Array<{ id: string; email: string }>;
}

export interface DriverFormData {
    userId: string;
    licenseNumber: string;
    phoneNumber: string;
    status: string;
}

export function DriverFormModal({ open, onClose, onSubmit, driver, users }: DriverFormModalProps) {
    const t = useTranslations();
    const [formData, setFormData] = useState<DriverFormData>({
        userId: '',
        licenseNumber: '',
        phoneNumber: '',
        status: 'OFF_DUTY',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (driver) {
            setFormData({
                userId: driver.userId,
                licenseNumber: driver.licenseNumber,
                phoneNumber: driver.phoneNumber,
                status: driver.status,
            });
        } else {
            setFormData({
                userId: '',
                licenseNumber: '',
                phoneNumber: '',
                status: 'OFF_DUTY',
            });
        }
        setError('');
    }, [driver, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.userId || !formData.licenseNumber || !formData.phoneNumber) {
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
                        {driver ? t('drivers.editDriver') : t('drivers.addDriver')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('drivers.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* User Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="userId">{t('users.email')}</Label>
                            {users.length === 0 ? (
                                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                                    ⚠️ DRIVER rolünde kullanıcı yok. Önce Users sayfasından DRIVER rolünde kullanıcı oluşturun.
                                </div>
                            ) : (
                                <Select
                                    value={formData.userId}
                                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kullanıcı seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* License Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="licenseNumber">{t('drivers.licenseNumber')}</Label>
                            <Input
                                id="licenseNumber"
                                type="text"
                                placeholder="ABC123456"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="phoneNumber">{t('drivers.phoneNumber')}</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="+90 555 123 4567"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">{t('drivers.status')}</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ON_DUTY">{t('statuses.ON_DUTY')}</SelectItem>
                                    <SelectItem value="OFF_DUTY">{t('statuses.OFF_DUTY')}</SelectItem>
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
