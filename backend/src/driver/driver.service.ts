import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverStatus } from '@prisma/client';

@Injectable()
export class DriverService {
    constructor(private prisma: PrismaService) { }

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

        return drivers;
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
                vehicle: true,
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
        isAvailable: boolean
    ) {
        await this.findOne(id);

        const driver = await this.prisma.driverProfile.update({
            where: { id },
            data: {
                status,
                isAvailable,
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


    async getActiveDrivers() {
        return this.findAll({ isActive: true, status: DriverStatus.ON_DUTY });
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

        return drivers;
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

        await this.prisma.$executeRaw`
            UPDATE driver_profiles
            SET 
                current_location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                last_location_update = NOW()
            WHERE id = ${driverId}
        `;

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


