import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

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
            orderBy: { createdAt: 'desc' },
        });
    }

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
            },
        });

        if (!vehicle) {
            throw new NotFoundException(`Vehicle with ID ${id} not found`);
        }

        return vehicle;
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
}
