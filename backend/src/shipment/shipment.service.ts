import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: { status?: ShipmentStatus; driverId?: string; startDate?: Date; endDate?: Date }) {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.driverId) {
            where.driverId = filters.driverId;
        }

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        return this.prisma.shipment.findMany({
            where,
            include: {
                driver: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByDriver(driverId: string) {
        return this.prisma.shipment.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id },
            include: {
                driver: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${id} not found`);
        }

        return shipment;
    }

    async create(createShipmentDto: CreateShipmentDto) {
        const { pickupLocation, deliveryLocation, estimatedArrival } = createShipmentDto;

        return this.prisma.shipment.create({
            data: {
                pickupLocation,
                deliveryLocation,
                estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
                status: ShipmentStatus.PENDING,
            },
        });
    }

    async update(id: string, updateShipmentDto: UpdateShipmentDto) {
        await this.findOne(id);

        return this.prisma.shipment.update({
            where: { id },
            data: {
                ...updateShipmentDto,
                estimatedArrival: updateShipmentDto.estimatedArrival
                    ? new Date(updateShipmentDto.estimatedArrival)
                    : undefined,
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    async assignDriver(id: string, driverId: string) {
        const shipment = await this.findOne(id);

        // Check if driver exists
        const driver = await this.prisma.user.findUnique({
            where: { id: driverId },
            include: { driverProfile: true },
        });

        if (!driver || !driver.driverProfile) {
            throw new NotFoundException('Driver not found');
        }

        // Check if driver is active
        if (!driver.driverProfile.isActive) {
            throw new BadRequestException('Driver is not active');
        }

        // Auto-update status to IN_TRANSIT if currently PENDING
        const updateData: any = { driverId };
        if (shipment.status === ShipmentStatus.PENDING) {
            updateData.status = ShipmentStatus.IN_TRANSIT;
        }

        return this.prisma.shipment.update({
            where: { id },
            data: updateData,
            include: {
                driver: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
        const shipment = await this.findOne(id);
        const { status, proofOfDelivery } = updateStatusDto;

        // Validate status transitions
        this.validateStatusTransition(shipment.status, status);

        // Require proof of delivery for DELIVERED status
        if (status === ShipmentStatus.DELIVERED && !proofOfDelivery) {
            throw new BadRequestException('Proof of delivery is required for DELIVERED status');
        }

        const updateData: any = { status };
        if (proofOfDelivery) {
            updateData.proofOfDelivery = proofOfDelivery;
        }

        return this.prisma.shipment.update({
            where: { id },
            data: updateData,
            include: {
                driver: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.shipment.delete({
            where: { id },
        });

        return { message: 'Shipment deleted successfully' };
    }

    private validateStatusTransition(currentStatus: ShipmentStatus, newStatus: ShipmentStatus) {
        const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
            [ShipmentStatus.PENDING]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
            [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED],
            [ShipmentStatus.DELIVERED]: [],
            [ShipmentStatus.CANCELLED]: [],
        };

        if (!validTransitions[currentStatus].includes(newStatus)) {
            throw new BadRequestException(
                `Invalid status transition from ${currentStatus} to ${newStatus}`
            );
        }
    }
}
