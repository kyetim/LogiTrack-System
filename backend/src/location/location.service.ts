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
        // Get all active drivers
        const drivers = await this.prisma.driverProfile.findMany({
            where: {
                isActive: true,
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

        // Get latest location for each driver
        const locationsPromises = drivers.map(async (driver) => {
            const location = await this.prisma.locationLog.findFirst({
                where: { driverId: driver.id },
                orderBy: { timestamp: 'desc' },
            });

            if (!location) return null;

            return {
                ...location,
                driver: {
                    id: driver.id,
                    status: driver.status,
                    licenseNumber: driver.licenseNumber,
                    user: driver.user,
                    vehicle: driver.vehicle,
                },
            };
        });

        const locations = await Promise.all(locationsPromises);
        return locations.filter(loc => loc !== null);
    }

    async create(createLocationDto: CreateLocationDto) {
        const { driverId, coordinates, speed, heading } = createLocationDto;

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
