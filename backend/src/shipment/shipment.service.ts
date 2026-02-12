import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ShipmentStatus } from '@prisma/client';

import { NotificationService } from '../notification/notification.service';
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class ShipmentService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private fileUploadService: FileUploadService
    ) { }

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

        // Generate tracking number
        const trackingNumber = `TRK${Date.now()}`;

        // Extract addresses from location JSON
        const origin = (pickupLocation as any).address || 'Unknown';
        const destination = (deliveryLocation as any).address || 'Unknown';

        return this.prisma.shipment.create({
            data: {
                trackingNumber,
                origin,
                destination,
                originCoordinates: pickupLocation,
                destinationCoordinates: deliveryLocation,
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

        const updatedShipment = await this.prisma.shipment.update({
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

        // Send notification to the driver
        await this.notificationService.sendPushNotification(
            driverId,
            'Yeni Sevkiyat Atandı',
            `Size yeni bir sevkiyat atandı: ${updatedShipment.trackingNumber}`,
            { shipmentId: updatedShipment.id }
        );

        return updatedShipment;
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

        const updatedShipment = await this.prisma.shipment.update({
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

        // Notify driver about status change (if relevant logic exists, or for admin)
        // For now, we only notify if status is CANCELLED
        if (status === ShipmentStatus.CANCELLED && updatedShipment.driverId) {
            await this.notificationService.sendPushNotification(
                updatedShipment.driverId,
                'Sevkiyat İptal Edildi',
                `Sevkiyat iptal edildi: ${updatedShipment.trackingNumber}`,
                { shipmentId: updatedShipment.id }
            );
        }

        return updatedShipment;
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

    // Delivery Proof Methods
    async createDeliveryProof(shipmentId: string, data: {
        photoUrl?: string;
        signatureUrl?: string;
        recipientName?: string;
        notes?: string;
    }) {
        // Verify shipment exists and is assigned
        const shipment = await this.findOne(shipmentId);

        if (!shipment.driverId) {
            throw new BadRequestException('Shipment must be assigned to a driver');
        }

        // Create delivery proof
        const deliveryProof = await this.prisma.deliveryProof.create({
            data: {
                shipmentId,
                photoUrl: data.photoUrl,
                signatureUrl: data.signatureUrl,
                recipientName: data.recipientName,
                notes: data.notes,
            },
        });

        // Update shipment status to DELIVERED
        await this.prisma.shipment.update({
            where: { id: shipmentId },
            data: { status: ShipmentStatus.DELIVERED },
        });

        return deliveryProof;
    }

    async getDeliveryProof(shipmentId: string) {
        const deliveryProof = await this.prisma.deliveryProof.findUnique({
            where: { shipmentId },
            include: {
                shipment: {
                    select: {
                        id: true,
                        trackingNumber: true,
                        status: true,
                    },
                },
            },
        });

        if (!deliveryProof) {
            throw new NotFoundException(`Delivery proof for shipment ${shipmentId} not found`);
        }

        return deliveryProof;
    }

    async uploadManualWaybill(id: string, file: Express.Multer.File) {
        const shipment = await this.findOne(id);

        // Upload file
        const uploadResult = await this.fileUploadService.uploadDocument(file);

        // Update shipment
        const updatedShipment = await this.prisma.shipment.update({
            where: { id },
            data: { waybillUrl: uploadResult.fileUrl },
            include: {
                driver: {
                    select: {
                        id: true,
                        pushToken: true
                    }
                }
            }
        });

        // Notify driver
        if (updatedShipment.driverId) {
            await this.notificationService.sendPushNotification(
                updatedShipment.driverId,
                'İrsaliye Yüklendi',
                `Sevkiyatınız için yeni irsaliye yüklendi: ${shipment.trackingNumber}`,
                { shipmentId: id, type: 'WAYBILL_UPLOADED' }
            );
        }

        return updatedShipment;
    }

    /**
     * Find shipments near driver's current location using PostGIS
     */
    async findNearbyShipments(driverId: string, radiusKm: number = 50) {
        try {
            // Use raw SQL to find nearby shipments using PostGIS
            // The SQL query will handle missing location data gracefully
            const nearbyShipments = await this.prisma.$queryRaw<any[]>`
                WITH driver_loc AS (
                    SELECT current_location
                    FROM driver_profiles
                    WHERE id = ${driverId}
                )
                SELECT 
                    s.*,
                    ST_Distance(
                        s.pickup_location,
                        driver_loc.current_location
                    )::integer AS distance_meters
                FROM shipments s, driver_loc
                WHERE 
                    s.status = 'PENDING'
                    AND s.driver_id IS NULL
                    AND driver_loc.current_location IS NOT NULL
                    AND s.pickup_location IS NOT NULL
                    AND ST_DWithin(
                        s.pickup_location,
                        driver_loc.current_location,
                        ${radiusKm * 1000}
                    )
                ORDER BY 
                    ST_Distance(s.pickup_location, driver_loc.current_location)
                LIMIT 10
            `;

            return nearbyShipments || [];
        } catch (error) {
            console.error('Error finding nearby shipments:', error);
            // Return empty array instead of throwing - graceful degradation
            return [];
        }
    }
}
