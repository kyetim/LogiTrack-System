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

    async getActiveDrivers() {
        return this.findAll({ isActive: true, status: DriverStatus.ON_DUTY });
    }
}
