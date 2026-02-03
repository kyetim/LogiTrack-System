'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Wrench } from 'lucide-react';

interface MaintenanceLog {
    id: string;
    type: string;
    description: string;
    cost: number;
    date: string;
}

interface MaintenanceHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    vehicleId: string | null;
}

export function MaintenanceHistoryDialog({ open, onClose, vehicleId }: MaintenanceHistoryDialogProps) {
    const t = useTranslations();
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [newLog, setNewLog] = useState({
        type: 'ROUTINE',
        description: '',
        cost: 0,
        date: new Date().toISOString().split('T')[0],
    });

    const fetchLogs = useCallback(async () => {
        if (!vehicleId) return;
        setIsLoading(true);
        try {
            const { data } = await api.get(`/vehicles/${vehicleId}`);
            setLogs(data.maintenanceLogs || []);
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    }, [vehicleId, t]);

    useEffect(() => {
        if (open && vehicleId) {
            fetchLogs();
            setShowAddForm(false);
        }
    }, [open, vehicleId, fetchLogs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleId) return;

        try {
            await api.post(`/vehicles/${vehicleId}/maintenance`, newLog);
            toast.success('Bakım kaydı eklendi');
            fetchLogs();
            setShowAddForm(false);
            // Reset form
            setNewLog({
                type: 'ROUTINE',
                description: '',
                cost: 0,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Bakım Geçmişi</span>
                        {!showAddForm && (
                            <Button size="sm" onClick={() => setShowAddForm(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Kayıt Ekle
                            </Button>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Araç bakım ve servis kayıtları
                    </DialogDescription>
                </DialogHeader>

                {showAddForm ? (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>İşlem Tipi</Label>
                                <Select
                                    value={newLog.type}
                                    onValueChange={(val) => setNewLog({ ...newLog, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ROUTINE">Rutin Bakım</SelectItem>
                                        <SelectItem value="REPAIR">Tamir</SelectItem>
                                        <SelectItem value="INSPECTION">Muayene</SelectItem>
                                        <SelectItem value="OTHER">Diğer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tarih</Label>
                                <Input
                                    type="date"
                                    value={newLog.date}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLog({ ...newLog, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea
                                value={newLog.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewLog({ ...newLog, description: e.target.value })}
                                placeholder="Yapılan işlemler..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Maliyet (TL)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={newLog.cost}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLog({ ...newLog, cost: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                                İptal
                            </Button>
                            <Button type="submit">Kaydet</Button>
                        </div>
                    </form>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Tip</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead className="text-right">Maliyet</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">Yükleniyor...</TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                            Kayıt bulunamadı
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {format(new Date(log.date), 'dd MMM yyyy', { locale: tr })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.type}</Badge>
                                            </TableCell>
                                            <TableCell>{log.description}</TableCell>
                                            <TableCell className="text-right">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(log.cost)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
