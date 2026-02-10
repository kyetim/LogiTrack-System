import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({ example: 'uuid', description: 'Recipient user ID' })
    @IsString()
    @IsNotEmpty()
    recipientId: string;

    @ApiProperty({ example: 'Hello, are you available?', description: 'Message content' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiPropertyOptional({ description: 'Attachments (file URLs as JSON array)' })
    @IsOptional()
    attachments?: any;
}
