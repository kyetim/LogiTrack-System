import { PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
    @ApiPropertyOptional({ description: 'Active status' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
