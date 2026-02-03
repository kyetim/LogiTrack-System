'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DeliveryProof {
    id: string;
    photoUrl?: string;
    signatureUrl?: string;
    recipientName?: string;
    notes?: string;
    deliveredAt: string;
}

interface DeliveryProofModalProps {
    shipmentId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function DeliveryProofModal({ shipmentId, isOpen, onClose }: DeliveryProofModalProps) {
    const [proof, setProof] = useState<DeliveryProof | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (shipmentId && isOpen) {
            fetchDeliveryProof();
        }
    }, [shipmentId, isOpen]);

    const fetchDeliveryProof = async () => {
        if (!shipmentId) return;

        setLoading(true);
        try {
            const { data } = await api.get(`/shipments/${shipmentId}/delivery-proof`);
            setProof(data);
        } catch (error) {
            toast.error('Failed to load delivery proof');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
    };

    if (!proof && !loading) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Delivery Proof</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : proof ? (
                    <div className="space-y-6">
                        {/* Photo */}
                        {proof.photoUrl && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">Photo</h3>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadImage(proof.photoUrl!, 'delivery-photo.jpg')}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                                <img
                                    src={proof.photoUrl}
                                    alt="Delivery Photo"
                                    className="w-full rounded-lg border"
                                />
                            </div>
                        )}

                        {/* Signature */}
                        {proof.signatureUrl && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">Signature</h3>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadImage(proof.signatureUrl!, 'signature.png')}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                                <div className="bg-white p-4 rounded-lg border">
                                    <img
                                        src={proof.signatureUrl}
                                        alt="Signature"
                                        className="max-h-48 mx-auto"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Recipient Name */}
                        {proof.recipientName && (
                            <div>
                                <h3 className="font-semibold mb-2">Recipient</h3>
                                <p className="text-gray-700">{proof.recipientName}</p>
                            </div>
                        )}

                        {/* Notes */}
                        {proof.notes && (
                            <div>
                                <h3 className="font-semibold mb-2">Notes</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{proof.notes}</p>
                            </div>
                        )}

                        {/* Delivery Time */}
                        <div>
                            <h3 className="font-semibold mb-2">Delivered At</h3>
                            <p className="text-gray-700">
                                {new Date(proof.deliveredAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
