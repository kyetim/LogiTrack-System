import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './create-driver.dto';
import { IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
    @IsOptional()
    @IsEnum(DriverStatus)
    status?: DriverStatus;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsUUID()
    vehicleId?: string;
}
