'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useRouteOptimization } from '@/hooks/useRouteOptimization';
import { useState, useEffect } from 'react';
import { OptimizationResult } from '@/types';

interface RouteOptimizationModalProps {
    open: boolean;
    onClose: () => void;
    driverId: string;
    driverEmail: string;
    onOptimized: () => void;
}

export default function RouteOptimizationModal({
    open,
    onClose,
    driverId,
    driverEmail,
    onOptimized,
}: RouteOptimizationModalProps) {
    const { previewOptimization, applyOptimization, loading, error } = useRouteOptimization();
    const [preview, setPreview] = useState<OptimizationResult | null>(null);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (open && driverId) {
            loadPreview();
        }
    }, [open, driverId]);

    const loadPreview = async () => {
        const result = await previewOptimization(driverId);
        setPreview(result);
    };

    const handleApply = async () => {
        setApplying(true);
        const success = await applyOptimization(driverId);
        setApplying(false);

        if (success) {
            onOptimized();
            onClose();
        }
    };

    const formatDistance = (meters: number) => {
        return (meters / 1000).toFixed(2) + ' km';
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Optimize Route for {driverEmail}</DialogTitle>
                    <DialogDescription>
                        Preview and apply route optimization to minimize travel time and distance
                    </DialogDescription>
                </DialogHeader>

                {loading && !preview && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {preview && (
                    <div className="space-y-4">
                        {/* Savings Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4">
                                <div className="text-sm text-muted-foreground">Distance Saved</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatDistance(preview.savings.distanceMeters)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {preview.savings.percentDistance.toFixed(1)}% reduction
                                </div>
                            </div>

                            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-4">
                                <div className="text-sm text-muted-foreground">Time Saved</div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatDuration(preview.savings.durationSeconds)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {preview.savings.percentDuration.toFixed(1)}% reduction
                                </div>
                            </div>
                        </div>

                        {/* Optimized Route Info */}
                        <div className="rounded-lg border p-4">
                            <div className="mb-2 text-sm font-medium">Optimized Route</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Total Distance:</span>{' '}
                                    <span className="font-medium">{formatDistance(preview.totalDistance)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Total Duration:</span>{' '}
                                    <span className="font-medium">{formatDuration(preview.totalDuration)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Order */}
                        <div className="rounded-lg border p-4">
                            <div className="mb-3 text-sm font-medium">Delivery Sequence</div>
                            <div className="space-y-2">
                                {preview.optimizedOrder.map((shipmentId, index) => (
                                    <div
                                        key={shipmentId}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                            {index + 1}
                                        </div>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {shipmentId.slice(0, 8)}...
                                        </span>
                                        {preview.originalOrder[index] !== shipmentId && (
                                            <Check className="h-4 w-4 text-green-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose} disabled={applying}>
                                Cancel
                            </Button>
                            <Button onClick={handleApply} disabled={applying}>
                                {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Apply Optimization
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
