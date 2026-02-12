import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RoutesClient } from '@googlemaps/routing';

interface Waypoint {
    shipmentId: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
}

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

@Injectable()
export class RouteOptimizationService {
    private readonly logger = new Logger(RouteOptimizationService.name);
    private routesClient: RoutesClient;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
        if (!apiKey) {
            this.logger.warn('GOOGLE_MAPS_API_KEY not configured. Route optimization will be disabled.');
        } else {
            this.routesClient = new RoutesClient({
                apiKey,
            });
        }
    }

    async optimizeDriverRoute(driverId: string): Promise<OptimizationResult> {
        if (!this.routesClient) {
            throw new BadRequestException('Route optimization is not configured. Please set GOOGLE_MAPS_API_KEY.');
        }

        // Get all PENDING shipments for the driver
        const shipments = await this.prisma.shipment.findMany({
            where: {
                driverId,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'asc' },
        });

        if (shipments.length < 2) {
            throw new BadRequestException('At least 2 shipments required for route optimization');
        }

        if (shipments.length > 25) {
            throw new BadRequestException('Maximum 25 shipments supported for route optimization');
        }

        // Extract waypoints from shipments
        const waypoints: Waypoint[] = shipments.map(s => ({
            shipmentId: s.id,
            location: s.destinationCoordinates as any,
            address: s.destination,
        }));

        this.logger.log(`Optimizing route for driver ${driverId} with ${waypoints.length} waypoints`);

        // Call Google Routes API
        const optimizationResult = await this.computeOptimizedRoute(waypoints);

        return optimizationResult;
    }

    async applyOptimization(driverId: string, optimizedOrder: string[]): Promise<void> {
        // Update shipment sequence in database
        const updates = optimizedOrder.map((shipmentId, index) =>
            this.prisma.shipment.update({
                where: { id: shipmentId },
                data: { sequence: index + 1 },
            }),
        );

        await this.prisma.$transaction(updates);
        this.logger.log(`Applied route optimization for driver ${driverId}`);
    }

    private async computeOptimizedRoute(waypoints: Waypoint[]): Promise<OptimizationResult> {
        // Use first waypoint as origin, last as destination
        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        const intermediates = waypoints.slice(1, -1);

        try {
            // Compute route WITHOUT optimization first (for comparison)
            const unoptimizedResponse = await this.routesClient.computeRoutes({
                origin: {
                    location: {
                        latLng: {
                            latitude: origin.location.lat,
                            longitude: origin.location.lng,
                        },
                    },
                },
                destination: {
                    location: {
                        latLng: {
                            latitude: destination.location.lat,
                            longitude: destination.location.lng,
                        },
                    },
                },
                intermediates: intermediates.map(wp => ({
                    location: {
                        latLng: {
                            latitude: wp.location.lat,
                            longitude: wp.location.lng,
                        },
                    },
                })),
                travelMode: 'DRIVE' as any,
                routingPreference: 'TRAFFIC_UNAWARE' as any,
            }, {
                otherArgs: {
                    headers: {
                        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
                    },
                },
            });

            const unoptimizedRoute = unoptimizedResponse[0]?.routes?.[0];
            const unoptimizedDistance = unoptimizedRoute?.distanceMeters || 0;
            const unoptimizedDuration = unoptimizedRoute?.duration
                ? parseInt(String((unoptimizedRoute.duration as any)?.seconds || (unoptimizedRoute.duration as any) || '0').replace('s', ''))
                : 0;

            // Compute route WITH optimization
            const optimizedResponse = await this.routesClient.computeRoutes({
                origin: {
                    location: {
                        latLng: {
                            latitude: origin.location.lat,
                            longitude: origin.location.lng,
                        },
                    },
                },
                destination: {
                    location: {
                        latLng: {
                            latitude: destination.location.lat,
                            longitude: destination.location.lng,
                        },
                    },
                },
                intermediates: intermediates.map(wp => ({
                    location: {
                        latLng: {
                            latitude: wp.location.lat,
                            longitude: wp.location.lng,
                        },
                    },
                })),
                travelMode: 'DRIVE' as any,
                routingPreference: 'TRAFFIC_UNAWARE' as any,
                optimizeWaypointOrder: true,
            }, {
                otherArgs: {
                    headers: {
                        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex',
                    },
                },
            });

            const optimizedRoute = optimizedResponse[0]?.routes?.[0];
            const optimizedDistance = optimizedRoute?.distanceMeters || 0;
            const optimizedDuration = optimizedRoute?.duration
                ? parseInt(String((optimizedRoute.duration as any)?.seconds || (optimizedRoute.duration as any) || '0').replace('s', ''))
                : 0;
            const optimizedIndices = optimizedRoute?.optimizedIntermediateWaypointIndex || [];

            // Reconstruct optimized order
            const originalOrder = waypoints.map(wp => wp.shipmentId);
            const optimizedOrder = [
                origin.shipmentId,
                ...optimizedIndices.map((idx: number) => intermediates[idx].shipmentId),
                destination.shipmentId,
            ];

            const distanceSavings = unoptimizedDistance - optimizedDistance;
            const durationSavings = unoptimizedDuration - optimizedDuration;

            return {
                originalOrder,
                optimizedOrder,
                totalDistance: optimizedDistance,
                totalDuration: optimizedDuration,
                savings: {
                    distanceMeters: distanceSavings,
                    durationSeconds: durationSavings,
                    percentDistance: (distanceSavings / unoptimizedDistance) * 100,
                    percentDuration: (durationSavings / unoptimizedDuration) * 100,
                },
            };
        } catch (error) {
            this.logger.error('Google Routes API error:', error);
            throw new BadRequestException('Failed to compute optimized route');
        }
    }
}
