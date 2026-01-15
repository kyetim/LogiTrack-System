import { IsEnum, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class UpdateStatusDto {
    @IsEnum(ShipmentStatus)
    @IsNotEmpty()
    status: ShipmentStatus;

    @IsObject()
    @IsOptional()
    proofOfDelivery?: any;
}
