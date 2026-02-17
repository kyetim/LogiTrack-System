import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({
        description: 'Message content',
        example: 'I need help with my delivery',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiPropertyOptional({
        description: 'File attachments (URLs)',
        example: ['https://example.com/file1.jpg'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}
