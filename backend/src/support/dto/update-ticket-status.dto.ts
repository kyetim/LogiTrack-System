import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDto {
    @ApiProperty({
        enum: TicketStatus,
        description: 'New ticket status',
        example: 'RESOLVED',
    })
    @IsEnum(TicketStatus)
    status: TicketStatus;

    @ApiPropertyOptional({
        description: 'Optional note when changing status',
        example: 'Issue has been resolved',
    })
    @IsOptional()
    @IsString()
    note?: string;
}
