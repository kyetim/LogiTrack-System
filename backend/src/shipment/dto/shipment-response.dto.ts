import { ShipmentStatus } from '@prisma/client';

export class ShipmentResponseDto {
    id: string;
    driverId: string | null;
    status: ShipmentStatus;
    pickupLocation: any;
    deliveryLocation: any;
    estimatedArrival: Date | null;
    proofOfDelivery: any | null;
    createdAt: Date;
    updatedAt: Date;
    driver?: {
        id: string;
        licenseNumber: string;
        user: {
            email: string;
        };
    };
}
