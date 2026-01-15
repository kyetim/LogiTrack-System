import { IsNotEmpty, IsString, IsUUID, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class CreateDriverDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    licenseNumber: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsEnum(DriverStatus)
    @IsOptional()
    status?: DriverStatus;
}
