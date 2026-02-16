import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: { driverId?: string; startDate?: Date; endDate?: Date }) {
        const where: any = {};

        if (filters?.driverId) {
            where.driverId = filters.driverId;
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

        return this.prisma.locationLog.findMany({
            where,
            include: {
                driver: {
                    select: {
                        id: true,
                        licenseNumber: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { timestamp: 'desc' },
            take: 100, // Limit to last 100 locations
        });
    }

    async findByDriver(driverId: string, limit: number = 50) {
        // Verify driver exists
        const driver = await this.prisma.driverProfile.findUnique({
            where: { id: driverId },
        });

        if (!driver) {
            throw new NotFoundException('Driver not found');
        }

        return this.prisma.locationLog.findMany({
            where: { driverId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    async getLatestLocation(driverId: string) {
        const location = await this.prisma.locationLog.findFirst({
            where: { driverId },
            orderBy: { timestamp: 'desc' },
            include: {
                driver: {
                    select: {
                        id: true,
                        licenseNumber: true,
                        status: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!location) {
            throw new NotFoundException('No location found for this driver');
        }

        return location;
    }

    async getLatestLocations() {
        // Get all active drivers who are ON_DUTY
        const drivers = await this.prisma.driverProfile.findMany({
            where: {
                isActive: true,
                // status: 'ON_DUTY', // Removing strict filter so all active drivers show up
            },
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
                vehicle: {
                    select: {
                        plateNumber: true,
                    },
                },
            },
        });

        // Fetch location for each driver using raw SQL (PostGIS)
        const locationsWithDrivers = await Promise.all(drivers.map(async (driver) => {
            try {
                // Using queryRawUnsafe to ensure UUID casting works correctly
                const locationResult: any[] = await this.prisma.$queryRawUnsafe(`
                    SELECT 
                        ST_Y(current_location::geometry) as latitude,
                        ST_X(current_location::geometry) as longitude,
                        last_location_update as timestamp
                    FROM driver_profiles 
                    WHERE id = '${driver.id}'
                `);

                const rawLoc = locationResult[0];

                // Only return if valid location exists
                if (!rawLoc || !rawLoc.latitude) return null;

                // Return in the structure expected by the frontend (simulating a LocationLog)
                return {
                    id: driver.id, // Use driver ID as unique key for the "location" object
                    driverId: driver.id,
                    coordinates: {
                        latitude: rawLoc.latitude,
                        longitude: rawLoc.longitude,
                    },
                    speed: 0, // Not stored in profile currently
                    heading: 0, // Not stored in profile currently
                    timestamp: rawLoc.timestamp || new Date(),
                    driver: {
                        id: driver.id,
                        status: driver.status,
                        licenseNumber: driver.licenseNumber,
                        user: driver.user,
                        vehicle: driver.vehicle,
                    },
                };
            } catch (error) {
                console.error(`Failed to fetch location for driver ${driver.id}:`, error);
                return null;
            }
        }));

        return locationsWithDrivers.filter(loc => loc !== null);
    }

    async create(createLocationDto: CreateLocationDto) {
        const { driverId, coordinates, speed, heading, timestamp } = createLocationDto;

        // Verify driver exists
        const driver = await this.prisma.driverProfile.findUnique({
            where: { id: driverId },
        });

        if (!driver) {
            throw new NotFoundException('Driver not found');
        }

        return this.prisma.locationLog.create({
            data: {
                driverId,
                coordinates,
                speed,
                heading,
                timestamp: timestamp ? new Date(timestamp) : undefined, // Use provided timestamp or default to now()
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        licenseNumber: true,
                    },
                },
            },
        });
    }

    async remove(id: string) {
        const location = await this.prisma.locationLog.findUnique({
            where: { id },
        });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        await this.prisma.locationLog.delete({
            where: { id },
        });

        return { message: 'Location deleted successfully' };
    }
}
