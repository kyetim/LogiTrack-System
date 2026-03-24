export interface OptimizationResult {
    originalOrder: string[];
    optimizedOrder: string[];
    totalDistance: number; // meters
    totalDuration: number; // seconds
    savings: {
        distanceMeters: number;
        durationSeconds: number;
        percentDistance: number;
        percentDuration: number;
    };
}
