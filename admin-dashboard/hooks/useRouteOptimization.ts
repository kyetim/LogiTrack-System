import api from '../services/api';
import { OptimizationResult } from '../types';
import { useState } from 'react';

export function useRouteOptimization() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const previewOptimization = async (driverId: string): Promise<OptimizationResult | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/route-optimization/preview/${driverId}`);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to preview route optimization';
            setError(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const applyOptimization = async (driverId: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            await api.post(`/route-optimization/optimize/${driverId}`);
            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to apply route optimization';
            setError(errorMsg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        previewOptimization,
        applyOptimization,
        loading,
        error,
    };
}
