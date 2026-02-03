import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MaintenanceType {
    ROUTINE = 'ROUTINE',
    REPAIR = 'REPAIR',
    INSPECTION = 'INSPECTION',
    OTHER = 'OTHER',
}

export class CreateMaintenanceLogDto {
    @ApiProperty({ enum: MaintenanceType })
    @IsEnum(MaintenanceType)
    type: MaintenanceType;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    cost: number;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    date?: string;
}
