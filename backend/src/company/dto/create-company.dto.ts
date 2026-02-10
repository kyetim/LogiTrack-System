import { IsEmail, IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Ufuk Lojistik A.Ş.', description: 'Company name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '1234567890', description: 'Tax identification number' })
    @IsString()
    @IsNotEmpty()
    taxNumber: string;

    @ApiProperty({ example: 'Istanbul, Turkey', description: 'Company address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ example: 'contact@ufuklojistik.com', description: 'Contact email' })
    @IsEmail()
    @IsNotEmpty()
    contactEmail: string;

    @ApiProperty({ example: '+90 555 123 4567', description: 'Contact phone number' })
    @IsString()
    @IsNotEmpty()
    contactPhone: string;

    @ApiPropertyOptional({ example: 100000, description: 'Credit limit', default: 0 })
    @IsNumber()
    @IsOptional()
    creditLimit?: number;
}
