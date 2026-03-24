import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, MaxLength } from 'class-validator';
import { TicketPriority } from '@prisma/client';

export class SendMessageDto {
    @ApiProperty({
        description: 'Message content',
        example: 'I need help with my delivery',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000, { message: 'Mesaj 2000 karakterden uzun olamaz.' })
    content: string;

    @ApiPropertyOptional({
        description: 'File attachments (URLs)',
        example: ['https://example.com/file1.jpg'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];

    @ApiPropertyOptional({
        description: 'Ticket priority (only used when creating new ticket)',
        enum: TicketPriority,
        example: 'HIGH',
    })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;
}
