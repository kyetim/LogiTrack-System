import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';

@Injectable()
export class VehicleService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.vehicle.findMany({
            include: {
                drivers: {
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
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAvailable() {
        return this.prisma.vehicle.findMany({
            where: {
                drivers: {
                    none: {},
                },
            },
            include: {
                maintenanceLogs: {
                    take: 1,
                    orderBy: { date: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ...

    async findOne(id: string) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                drivers: {
                    select: {
                        id: true,
                        licenseNumber: true,
                        status: true,
                        isActive: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
                maintenanceLogs: {
                    orderBy: { date: 'desc' },
                },
            },
        });

        if (!vehicle) {
            throw new NotFoundException(`Vehicle with ID ${id} not found`);
        }

        return vehicle;
    }

    // ... (create, update, remove)

    async addMaintenanceLog(id: string, createLogDto: CreateMaintenanceLogDto) {
        await this.findOne(id); // Ensure exists

        return this.prisma.$transaction(async (tx) => {
            const log = await tx.maintenanceLog.create({
                data: {
                    vehicleId: id,
                    ...createLogDto,
                    date: createLogDto.date ? new Date(createLogDto.date) : new Date(),
                },
            });

            // Update vehicle last service date
            await tx.vehicle.update({
                where: { id },
                data: {
                    lastServiceDate: log.date,
                },
            });

            return log;
        });
    }

    async create(createVehicleDto: CreateVehicleDto) {
        const { plateNumber, capacity, type } = createVehicleDto;

        // Check if plate number already exists
        const existing = await this.prisma.vehicle.findUnique({
            where: { plateNumber },
        });

        if (existing) {
            throw new ConflictException('Vehicle with this plate number already exists');
        }

        return this.prisma.vehicle.create({
            data: {
                plateNumber,
                capacity,
                type,
            },
        });
    }

    async update(id: string, updateVehicleDto: UpdateVehicleDto) {
        await this.findOne(id);

        // Check plate number uniqueness if being updated
        if (updateVehicleDto.plateNumber) {
            const existing = await this.prisma.vehicle.findUnique({
                where: { plateNumber: updateVehicleDto.plateNumber },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException('Plate number already in use');
            }
        }

        return this.prisma.vehicle.update({
            where: { id },
            data: updateVehicleDto,
            include: {
                drivers: {
                    select: {
                        id: true,
                        licenseNumber: true,
                        status: true,
                    },
                },
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        // Check if vehicle has assigned drivers
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: { drivers: true },
        });

        if (vehicle.drivers.length > 0) {
            throw new ConflictException('Cannot delete vehicle with assigned drivers');
        }

        await this.prisma.vehicle.delete({
            where: { id },
        });

        return { message: 'Vehicle deleted successfully' };
    }

    async assignDriver(vehicleId: string, driverId: string) {
        // Check if vehicle exists
        await this.findOne(vehicleId);

        // Check if driver exists
        const driver = await this.prisma.driverProfile.findUnique({
            where: { userId: driverId },
        });

        if (!driver) {
            throw new NotFoundException(`Driver with ID ${driverId} not found`);
        }

        // Assign driver to vehicle
        return this.prisma.driverProfile.update({
            where: { userId: driverId },
            data: {
                vehicleId: vehicleId,
            },
        });
    }

    async unassignDriver(vehicleId: string, driverId: string) {
        await this.findOne(vehicleId);

        return this.prisma.driverProfile.update({
            where: { userId: driverId },
            data: {
                vehicleId: null,
            },
        });
    }
}
