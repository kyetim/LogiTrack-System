import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverStatus } from '@prisma/client';

import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class DriverService {
    constructor(
        private prisma: PrismaService,
        private websocketGateway: WebsocketGateway
    ) { }

    async findAll(filters?: { isActive?: boolean; status?: DriverStatus; vehicleId?: string }) {
        const where: any = {};

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.vehicleId) {
            where.vehicleId = filters.vehicleId;
        }

        const drivers = await this.prisma.driverProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        type: true,
                        capacity: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Manually fetch location for each driver using raw SQL
        // Prisma doesn't support PostGIS geography type directly
        const driversWithLocation = await Promise.all(drivers.map(async (driver) => {
            try {
                // Using queryRawUnsafe to ensure UUID casting works correctly
                const locationResult: any[] = await this.prisma.$queryRawUnsafe(`
                    SELECT 
                        ST_Y(current_location::geometry) as latitude,
                        ST_X(current_location::geometry) as longitude
                    FROM driver_profiles 
                    WHERE id = '${driver.id}'
                `);

                const location = locationResult[0]?.latitude ? {
                    latitude: locationResult[0].latitude,
                    longitude: locationResult[0].longitude
                } : null;

                // Fix: Convert Prisma object to plain JSON to ensure custom fields are included
                const plainDriver = JSON.parse(JSON.stringify(driver));

                return {
                    ...plainDriver,
                    locationCoordinates: location,
                };
            } catch (error) {
                console.error(`Failed to fetch location for driver ${driver.id}:`, error);
                return { ...driver, locationCoordinates: null };
            }
        }));

        return driversWithLocation;
    }

    async findOne(id: string) {
        const driver = await this.prisma.driverProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        type: true,
                        capacity: true,
                    },
                },
            },
        });

        if (!driver) {
            throw new NotFoundException(`Driver with ID ${id} not found`);
        }

        return driver;
    }

    async findByUserId(userId: string) {
        return this.prisma.driverProfile.findUnique({
            where: { userId },
            include: {
                vehicle: true,
            },
        });
    }

    async create(createDriverDto: CreateDriverDto) {
        const { userId, licenseNumber, vehicleId, isActive, status } = createDriverDto;

        // Check if user exists
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user already has a driver profile
        const existingDriver = await this.findByUserId(userId);
        if (existingDriver) {
            throw new ConflictException('User already has a driver profile');
        }

        // Check if license number is unique
        const existingLicense = await this.prisma.driverProfile.findUnique({
            where: { licenseNumber },
        });
        if (existingLicense) {
            throw new ConflictException('License number already in use');
        }

        // Check if vehicle exists (if provided)
        if (vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) {
                throw new NotFoundException('Vehicle not found');
            }
        }

        const driver = await this.prisma.driverProfile.create({
            data: {
                userId,
                licenseNumber,
                vehicleId,
                isActive: isActive ?? true,
                status: status ?? DriverStatus.OFF_DUTY,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        type: true,
                        capacity: true,
                    },
                },
            },
        });

        return driver;
    }

    async update(id: string, updateDriverDto: UpdateDriverDto) {
        await this.findOne(id);

        const { licenseNumber, vehicleId } = updateDriverDto;

        // Check license number uniqueness if being updated
        if (licenseNumber) {
            const existing = await this.prisma.driverProfile.findUnique({
                where: { licenseNumber },
            });
            if (existing && existing.id !== id) {
                throw new ConflictException('License number already in use');
            }
        }

        // Check vehicle exists if being updated
        if (vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) {
                throw new NotFoundException('Vehicle not found');
            }
        }

        const driver = await this.prisma.driverProfile.update({
            where: { id },
            data: updateDriverDto,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: true,
            },
        });

        return driver;
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.driverProfile.delete({
            where: { id },
        });

        return { message: 'Driver profile deleted successfully' };
    }

    async updateStatus(id: string, status: DriverStatus) {
        await this.findOne(id);

        const driver = await this.prisma.driverProfile.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return driver;
    }

    async assignVehicle(id: string, vehicleId: string | null) {
        await this.findOne(id);

        if (vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle) {
                throw new NotFoundException('Vehicle not found');
            }
        }

        const driver = await this.prisma.driverProfile.update({
            where: { id },
            data: { vehicleId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: true,
            },
        });

        return driver;
    }

    /**
     * Update driver status and availability atomically
     * Used by mobile app availability toggle
     */
    async updateStatusAndAvailability(
        id: string,
        status: DriverStatus,
        isAvailable: boolean,
        isAvailableForWork: boolean
    ) {
        await this.findOne(id);

        const driver = await this.prisma.driverProfile.update({
            where: { id },
            data: {
                status,
                isAvailable,
                isAvailableForWork,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: true,
            },
        });

        // Broadcast the status change
        await this.broadcastDriverUpdate(id);

        return driver;
    }

    private async broadcastDriverUpdate(driverId: string) {
        try {
            const driver = await this.findOne(driverId);

            // Re-use the location:update event structure since it carries full driver info
            // or we could create a specific driver:update event. 
            // For now, let's use location:update as the frontend already listens to it and updates the list.
            // We need to fetch the latest location for this.

            const locationResult: any[] = await this.prisma.$queryRawUnsafe(`
                SELECT 
                    ST_Y(current_location::geometry) as latitude,
                    ST_X(current_location::geometry) as longitude
                FROM driver_profiles 
                WHERE id = '${driver.id}'
            `);

            const coordinates = locationResult[0]?.latitude ? {
                latitude: locationResult[0].latitude,
                longitude: locationResult[0].longitude
            } : { latitude: 0, longitude: 0 }; // Fallback if no location yet

            this.websocketGateway.server.to('dispatchers').emit('location:update', {
                driverId: driver.id,
                driverEmail: driver.user.email,
                coordinates: coordinates,
                timestamp: new Date(),
                driver: {
                    id: driver.id,
                    status: driver.status,
                    isAvailable: driver.isAvailable,
                    licenseNumber: driver.licenseNumber,
                    user: {
                        email: driver.user.email
                    },
                    vehicle: driver.vehicle ? {
                        plateNumber: driver.vehicle.plateNumber
                    } : undefined
                }
            });
        } catch (error) {
            console.error('Failed to broadcast driver update:', error);
        }
    }


    async getActiveDrivers() {
        return this.findAll({ isActive: true });
    }

    /**
     * Get all available drivers (not currently assigned) with their vehicle info
     */
    async getAvailableDrivers() {
        const drivers = await this.prisma.driverProfile.findMany({
            where: {
                isActive: true,
                status: DriverStatus.ON_DUTY,
                isAvailable: true, // New field for internal availability tracking
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        phoneNumber: true,
                    },
                },
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        type: true,
                        vehicleTypeEnum: true,
                        capacity: true,
                        maxWeight: true,
                        maxVolume: true,
                        status: true,
                    },
                },
                score: {
                    select: {
                        overallScore: true,
                        safetyScore: true,
                        punctualityScore: true,
                    },
                },
            },
            orderBy: [
                { score: { overallScore: 'desc' } }, // Best drivers first
                { createdAt: 'asc' },
            ],
        });

        // Manually fetch location for each driver using raw SQL
        // Prisma doesn't support PostGIS geography type directly
        const driversWithLocation = await Promise.all(drivers.map(async (driver) => {
            try {
                // Using queryRawUnsafe to ensure UUID casting works correctly
                const locationResult: any[] = await this.prisma.$queryRawUnsafe(`
                    SELECT 
                        ST_Y(current_location::geometry) as latitude,
                        ST_X(current_location::geometry) as longitude
                    FROM driver_profiles 
                    WHERE id = '${driver.id}'
                `);

                // console.log(`📍 Location fetch for ${driver.id}:`, locationResult);

                const location = locationResult[0]?.latitude ? {
                    latitude: locationResult[0].latitude,
                    longitude: locationResult[0].longitude
                } : null;

                // Fix: Convert Prisma object to plain JSON to ensure custom fields are included
                const plainDriver = JSON.parse(JSON.stringify(driver));

                return {
                    ...plainDriver,
                    locationCoordinates: location,
                };
            } catch (error) {
                console.error(`Failed to fetch location for driver ${driver.id}:`, error);
                return { ...driver, locationCoordinates: null };
            }
        }));

        return driversWithLocation;
    }

    /**
     * Update driver availability status
     */
    async updateAvailability(id: string, availabilityData: {
        isAvailable?: boolean;
        currentLoadCapacity?: number;
        preferredRoutes?: any;
    }) {
        await this.findOne(id);

        const driver = await this.prisma.driverProfile.update({
            where: { id },
            data: {
                isAvailable: availabilityData.isAvailable,
                currentLoadCapacity: availabilityData.currentLoadCapacity,
                preferredRoutes: availabilityData.preferredRoutes,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                vehicle: true,
            },
        });

        return driver;
    }

    /**
     * Get driver availability summary (for dispatcher dashboard)
     */
    async getAvailabilitySummary() {
        const [total, active, onDuty, available] = await Promise.all([
            this.prisma.driverProfile.count(),
            this.prisma.driverProfile.count({ where: { isActive: true } }),
            this.prisma.driverProfile.count({
                where: {
                    isActive: true,
                    status: DriverStatus.ON_DUTY,
                },
            }),
            this.prisma.driverProfile.count({
                where: {
                    isActive: true,
                    status: DriverStatus.ON_DUTY,
                    isAvailable: true,
                },
            }),
        ]);

        return {
            total,
            active,
            onDuty,
            available,
            offDuty: active - onDuty,
            busy: onDuty - available,
        };
    }

    /**
     * Update driver's current location using PostGIS
     */
    async updateDriverLocation(driverId: string, lat: number, lng: number) {
        await this.findOne(driverId);

        // Initialize the location update in DB
        await this.prisma.$executeRaw`
            UPDATE driver_profiles
            SET 
                current_location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                last_location_update = NOW()
            WHERE id = ${driverId}
        `;

        // Retrieve driver details for broadcast
        // We need user email and other details
        const driver = await this.findOne(driverId);

        // Broadcast to dispatchers via WebSocket
        try {
            this.websocketGateway.server.to('dispatchers').emit('location:update', {
                driverId: driver.id,
                driverEmail: driver.user.email,
                coordinates: { latitude: lat, longitude: lng },
                timestamp: new Date(),
                // Send full driver details so frontend can add to list if missing
                driver: {
                    id: driver.id,
                    status: driver.status,
                    isAvailable: driver.isAvailable,
                    isAvailableForWork: driver.isAvailableForWork,
                    licenseNumber: driver.licenseNumber,
                    lastLocationUpdate: new Date().toISOString(),
                    user: {
                        email: driver.user.email
                    },
                    vehicle: driver.vehicle ? {
                        plateNumber: driver.vehicle.plateNumber
                    } : undefined
                }
            });
        } catch (error) {
            console.error('Failed to broadcast location update:', error);
            // Don't fail the HTTP request if socket broadcast fails
        }

        return { success: true, message: 'Location updated successfully' };
    }

    /**
     * Set driver availability for work (for nearby job matching)
     */
    async setAvailabilityForWork(driverId: string, isAvailable: boolean) {
        await this.findOne(driverId);

        // Use raw SQL to update availability until Prisma client regenerates
        await this.prisma.$executeRaw`
            UPDATE driver_profiles
            SET is_available_for_work = ${isAvailable}
            WHERE id = ${driverId}
        `;

        // Return updated driver
        return this.findOne(driverId);
    }
}
