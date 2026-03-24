import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGeofenceDto } from './dto/create-geofence.dto';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';
import { CheckLocationDto } from './dto/check-location.dto';
import { GeofenceEventType } from '@prisma/client';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { PushNotificationService } from '../push-notification/push-notification.service';

@Injectable()
export class GeofencingService {
    constructor(
        private prisma: PrismaService,
        private wsGateway: WebsocketGateway,
        private pushNotification: PushNotificationService,
    ) { }

    /**
     * Create a new geofence
     */
    async create(createGeofenceDto: CreateGeofenceDto) {
        const geofence = await this.prisma.geofence.create({
            data: {
                name: createGeofenceDto.name,
                type: createGeofenceDto.type,
                center: createGeofenceDto.center as any, // Cast to any for JSON field
                radius: createGeofenceDto.radius,
                isActive: createGeofenceDto.isActive ?? true,
            },
        });

        return geofence;
    }

    /**
     * Get all geofences with optional filtering
     */
    async findAll(filters?: { isActive?: boolean; type?: string }) {
        const where: any = {};

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        const geofences = await this.prisma.geofence.findMany({
            where,
            include: {
                _count: {
                    select: {
                        events: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return geofences;
    }

    /**
     * Get a specific geofence by ID
     */
    async findOne(id: string) {
        const geofence = await this.prisma.geofence.findUnique({
            where: { id },
            include: {
                events: {
                    take: 10,
                    orderBy: { timestamp: 'desc' },
                    include: {
                        driver: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!geofence) {
            throw new NotFoundException(`Geofence with ID ${id} not found`);
        }

        return geofence;
    }

    /**
     * Update a geofence
     */
    async update(id: string, updateGeofenceDto: UpdateGeofenceDto) {
        await this.findOne(id);

        const updateData: any = { ...updateGeofenceDto };

        const geofence = await this.prisma.geofence.update({
            where: { id },
            data: updateData,
        });

        return geofence;
    }

    /**
     * Delete a geofence
     */
    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.geofence.delete({
            where: { id },
        });

        return { message: 'Geofence deleted successfully' };
    }

    /**
     * Check if a location is within any active geofences
     * Uses Haversine formula for distance calculation
     */
    async checkLocation(checkLocationDto: CheckLocationDto) {
        const { lat, lng, driverId, shipmentId } = checkLocationDto;

        // Get all active geofences
        const geofences = await this.findAll({ isActive: true });

        const matchedGeofences = [];

        for (const geofence of geofences) {
            const center = geofence.center as any;
            const distance = this.calculateDistance(
                lat,
                lng,
                center.lat,
                center.lng
            );

            if (distance <= geofence.radius) {
                matchedGeofences.push({
                    ...geofence,
                    distance,
                    isInside: true,
                });

                // Optionally create an event if driver/shipment ID provided
                if (driverId) {
                    await this.createEvent({
                        geofenceId: geofence.id,
                        driverId,
                        shipmentId,
                        eventType: GeofenceEventType.ENTER,
                        location: { lat, lng },
                    });
                }
            }
        }

        return {
            location: { lat, lng },
            isInsideAnyGeofence: matchedGeofences.length > 0,
            matchedGeofences,
        };
    }

    /**
     * Get all geofence events with optional filtering
     */
    async getEvents(filters?: {
        driverId?: string;
        geofenceId?: string;
        eventType?: GeofenceEventType;
        startDate?: Date;
        endDate?: Date;
    }) {
        const where: any = {};

        if (filters?.driverId) {
            where.driverId = filters.driverId;
        }

        if (filters?.geofenceId) {
            where.geofenceId = filters.geofenceId;
        }

        if (filters?.eventType) {
            where.eventType = filters.eventType;
        }

        if (filters?.startDate || filters?.endDate) {
            where.timestamp = {};
            if (filters.startDate) {
                where.timestamp.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.timestamp.lte = filters.endDate;
            }
        }

        const events = await this.prisma.geofenceEvent.findMany({
            where,
            include: {
                geofence: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
                shipment: {
                    select: {
                        id: true,
                        trackingNumber: true,
                    },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: 100,
        });

        return events;
    }

    /**
     * Create a geofence event (entry/exit)
     */
    private async createEvent(data: {
        geofenceId: string;
        driverId: string;
        shipmentId?: string;
        eventType: GeofenceEventType;
        location: { lat: number; lng: number };
    }) {
        // Check if there's a recent event of the same type to avoid duplicates
        const recentEvent = await this.prisma.geofenceEvent.findFirst({
            where: {
                geofenceId: data.geofenceId,
                driverId: data.driverId,
                eventType: data.eventType,
                timestamp: {
                    gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
                },
            },
        });

        if (recentEvent) {
            return recentEvent; // Don't create duplicate
        }

        const event = await this.prisma.geofenceEvent.create({
            data: {
                geofenceId: data.geofenceId,
                driverId: data.driverId,
                shipmentId: data.shipmentId,
                eventType: data.eventType,
                location: data.location,
            },
            include: {
                geofence: true,
                driver: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        // Notify dispatchers via WebSocket
        const driverName = event.driver?.user?.email ?? event.driverId;
        const eventLabel = event.eventType === GeofenceEventType.ENTER ? 'girdi' : 'çıktı';
        this.wsGateway.server.to('dispatchers').emit('geofence:event', {
            geofenceId: event.geofenceId,
            geofenceName: event.geofence?.name,
            driverId: event.driverId,
            driverName,
            eventType: event.eventType,
            shipmentId: event.shipmentId ?? null,
            timestamp: new Date(),
        });

        // Send push notification to dispatcher(s)
        const dispatchers = await this.prisma.user.findMany({
            where: { role: 'DISPATCHER' },
            select: { id: true },
        });
        for (const dispatcher of dispatchers) {
            await this.pushNotification.sendToUser({
                userId: dispatcher.id,
                title: 'Geofence Olayı',
                body: `Sürücü ${driverName}, ${event.geofence?.name ?? 'bölgeye'} ${eventLabel}.`,
                type: 'INFO' as any,
                data: { type: 'geofence_event', geofenceId: event.geofenceId, driverId: event.driverId },
            });
        }

        return event;
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Get statistics for a specific geofence
     */
    async getGeofenceStatistics(id: string) {
        await this.findOne(id);

        const [totalEvents, enterEvents, exitEvents, uniqueDrivers] =
            await Promise.all([
                this.prisma.geofenceEvent.count({ where: { geofenceId: id } }),
                this.prisma.geofenceEvent.count({
                    where: { geofenceId: id, eventType: GeofenceEventType.ENTER },
                }),
                this.prisma.geofenceEvent.count({
                    where: { geofenceId: id, eventType: GeofenceEventType.EXIT },
                }),
                this.prisma.geofenceEvent.findMany({
                    where: { geofenceId: id },
                    select: { driverId: true },
                    distinct: ['driverId'],
                }),
            ]);

        return {
            totalEvents,
            enterEvents,
            exitEvents,
            uniqueDrivers: uniqueDrivers.length,
        };
    }
}
