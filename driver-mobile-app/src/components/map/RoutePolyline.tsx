import React from 'react';
import { Polyline } from 'react-native-maps';

export interface RoutePolylineProps {
    coordinates: Array<{ latitude: number; longitude: number }>;
    variant?: 'active' | 'preview';
}

export const RoutePolyline: React.FC<RoutePolylineProps> = ({
    coordinates,
    variant = 'active',
}) => {
    if (!coordinates || coordinates.length === 0) return null;

    if (variant === 'active') {
        return (
            <>
                {/* Shadow/Glow Polyline */}
                <Polyline
                    coordinates={coordinates}
                    strokeColor="rgba(255, 215, 0, 0.2)"
                    strokeWidth={8}
                    zIndex={1}
                />
                {/* Main Polyline */}
                <Polyline
                    coordinates={coordinates}
                    strokeColor="#FFD700"
                    strokeWidth={4}
                    zIndex={2}
                />
            </>
        );
    }

    // Preview variant
    return (
        <Polyline
            coordinates={coordinates}
            strokeColor="rgba(255, 215, 0, 0.5)"
            strokeWidth={2.5}
            lineDashPattern={[8, 4]}
            zIndex={1}
        />
    );
};
