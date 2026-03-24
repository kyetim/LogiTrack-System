import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddInternalNoteDto {
    @ApiProperty({
        description: 'Internal note content (driver will not see this)',
        example: 'This driver has a history of late deliveries',
    })
    @IsString()
    @IsNotEmpty()
    content: string;
}
