import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, Loader2, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";

interface Document {
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    status: string; // or isVerified boolean
    isVerified: boolean;
    expiryDate: string | null;
    uploadedAt: string;
}

interface DriverDocumentsModalProps {
    open: boolean;
    onClose: () => void;
    driverId: string | null;
    driverName: string;
}

export function DriverDocumentsModal({ open, onClose, driverId, driverName }: DriverDocumentsModalProps) {
    const t = useTranslations();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    useEffect(() => {
        if (open && driverId) {
            fetchDocuments();
        }
    }, [open, driverId]);

    const fetchDocuments = async () => {
        if (!driverId) return;
        try {
            setLoading(true);
            // Fetch documents for this driver
            const { data } = await api.get('/documents', {
                params: {
                    entityType: 'DRIVER',
                    entityId: driverId
                }
            });
            setDocuments(data);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (docId: string) => {
        try {
            setVerifyingId(docId);
            await api.post(`/documents/${docId}/verify`);
            toast.success(t('documents.verifySuccess'));
            fetchDocuments(); // Refresh list
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setVerifyingId(null);
        }
    };

    const formatDocType = (type: string) => {
        // Simple formatter, preferably use translations
        return type.replace(/_/g, ' ');
    };

    const getCorrectFileUrl = (url: string) => {
        if (!url) return '';
        // Fix for backend returning localhost:3000 when running on 4000
        if (url.includes('localhost:3000/uploads')) {
            return url.replace('localhost:3000', 'localhost:4000');
        }
        return url;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('drivers.documents')} - {driverName}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('documents.type')}</TableHead>
                                <TableHead>{t('documents.fileName')}</TableHead>
                                <TableHead>{t('documents.uploadDate')}</TableHead>
                                <TableHead>{t('documents.expiryDate')}</TableHead>
                                <TableHead>{t('documents.status')}</TableHead>
                                <TableHead className="text-right">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        {t('common.noResults')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{formatDocType(doc.type)}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={doc.fileName}>
                                            {doc.fileName}
                                        </TableCell>
                                        <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {doc.isVerified ? (
                                                <Badge className="bg-green-500">{t('documents.verified')}</Badge>
                                            ) : (
                                                <Badge variant="secondary">{t('documents.pending')}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={getCorrectFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                {!doc.isVerified && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleVerify(doc.id)}
                                                        disabled={!!verifyingId}
                                                    >
                                                        {verifyingId === doc.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Check className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
}
