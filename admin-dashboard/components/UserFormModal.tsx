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

interface UserFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => Promise<void>;
    user?: {
        id: string;
        email: string;
        role: string;
    } | null;
}

export interface UserFormData {
    email: string;
    password?: string;
    role: string;
}

export function UserFormModal({ open, onClose, onSubmit, user }: UserFormModalProps) {
    const t = useTranslations();
    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        password: '',
        role: 'DISPATCHER',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                password: '',
                role: user.role,
            });
        } else {
            setFormData({
                email: '',
                password: '',
                role: 'DISPATCHER',
            });
        }
        setError('');
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.email) {
            setError(t('common.required'));
            return;
        }

        if (!user && !formData.password) {
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
                        {user ? t('users.editUser') : t('users.createUser')}
                    </DialogTitle>
                    <DialogDescription>
                        {user ? t('users.subtitle') : t('users.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('users.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t('users.enterEmail')}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {user ? t('users.passwordOptional') : t('auth.password')}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={t('users.enterPassword')}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!user}
                            />
                        </div>

                        {/* Role */}
                        <div className="grid gap-2">
                            <Label htmlFor="role">{t('users.role')}</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('users.selectRole')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">{t('roles.ADMIN')}</SelectItem>
                                    <SelectItem value="DISPATCHER">{t('roles.DISPATCHER')}</SelectItem>
                                    <SelectItem value="DRIVER">{t('roles.DRIVER')}</SelectItem>
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
