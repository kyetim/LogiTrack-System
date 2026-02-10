import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckLocationDto {
    @ApiProperty({ example: 41.0082, description: 'Latitude to check' })
    @IsNumber()
    @IsNotEmpty()
    lat: number;

    @ApiProperty({ example: 28.9784, description: 'Longitude to check' })
    @IsNumber()
    @IsNotEmpty()
    lng: number;

    @ApiPropertyOptional({ description: 'Driver ID (if checking for specific driver)' })
    @IsString()
    @IsOptional()
    driverId?: string;

    @ApiPropertyOptional({ description: 'Shipment ID (if checking for specific shipment)' })
    @IsString()
    @IsOptional()
    shipmentId?: string;
}
