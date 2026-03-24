import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CompanyUserRole } from '@prisma/client';

export class AddUserToCompanyDto {
    @ApiProperty({ example: 'user-uuid', description: 'User ID to add' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({
        example: 'MANAGER',
        description: 'User role in company',
        enum: CompanyUserRole
    })
    @IsEnum(CompanyUserRole)
    @IsNotEmpty()
    role: CompanyUserRole;
}
