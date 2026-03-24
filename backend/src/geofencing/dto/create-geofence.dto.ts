import { IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeofenceType } from '@prisma/client';
import { Type } from 'class-transformer';

class LocationDto {
    @ApiProperty({ example: 41.0082, description: 'Latitude' })
    @IsNumber()
    lat: number;

    @ApiProperty({ example: 28.9784, description: 'Longitude' })
    @IsNumber()
    lng: number;
}

export class CreateGeofenceDto {
    @ApiProperty({ example: 'Istanbul Warehouse', description: 'Geofence name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'WAREHOUSE',
        description: 'Type of geofence',
        enum: GeofenceType
    })
    @IsEnum(GeofenceType)
    @IsNotEmpty()
    type: GeofenceType;

    @ApiProperty({ description: 'Center coordinates', type: LocationDto })
    @ValidateNested()
    @Type(() => LocationDto)
    @IsNotEmpty()
    center: LocationDto;

    @ApiProperty({ example: 500, description: 'Radius in meters' })
    @IsNumber()
    @IsNotEmpty()
    radius: number;

    @ApiPropertyOptional({ default: true, description: 'Is geofence active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
