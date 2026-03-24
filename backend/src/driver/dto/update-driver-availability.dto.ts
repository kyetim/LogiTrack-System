import { IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDriverAvailabilityDto {
    @ApiPropertyOptional({ description: 'Is driver available for new assignments' })
    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @ApiPropertyOptional({ description: 'Current load capacity' })
    @IsNumber()
    @IsOptional()
    currentLoadCapacity?: number;

    @ApiPropertyOptional({ description: 'Preferred routes (JSON)' })
    @IsOptional()
    preferredRoutes?: any;
}
