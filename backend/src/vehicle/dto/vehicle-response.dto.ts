export class VehicleResponseDto {
    id: string;
    plateNumber: string;
    capacity: number;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    drivers?: Array<{
        id: string;
        licenseNumber: string;
        status: string;
        user: {
            email: string;
        };
    }>;
}
