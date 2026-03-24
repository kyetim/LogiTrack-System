import { DriverStatus } from '@prisma/client';

export class DriverResponseDto {
    id: string;
    userId: string;
    licenseNumber: string;
    vehicleId: string | null;
    isActive: boolean;
    status: DriverStatus;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        email: string;
        role: string;
    };
    vehicle?: {
        id: string;
        plateNumber: string;
        type: string;
    };
}
