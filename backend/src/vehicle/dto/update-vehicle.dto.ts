import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum VehicleStatus {
    ACTIVE = 'ACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    RETIRED = 'RETIRED',
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
    @IsOptional()
    @IsEnum(VehicleStatus)
    status?: VehicleStatus;

    @IsOptional()
    @IsNumber()
    mileage?: number;
}
