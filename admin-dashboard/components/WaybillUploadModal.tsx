import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Loader2, Upload } from 'lucide-react';

interface WaybillUploadModalProps {
    shipmentId: string | null;
    open: boolean;
    onClose: () => void;
}

export function WaybillUploadModal({ shipmentId, open, onClose }: WaybillUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shipmentId || !file) return;

        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            await api.post(`/shipments/${shipmentId}/upload-waybill`, formData);

            toast.success('İrsaliye başarıyla yüklendi');
            onClose();
            setFile(null); // Reset file
        } catch (error) {
            console.error('Waybill upload error:', error);
            toast.error('Yükleme başarısız oldu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>İrsaliye Yükle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="waybill">PDF Dosyası Seç</Label>
                        <Input
                            id="waybill"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={!file || isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Yükleniyor
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Yükle
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
