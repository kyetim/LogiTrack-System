import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100, { message: 'limit en fazla 100 olabilir.' })
    limit?: number = 20;
}

export function getPaginationParams(dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100); // Her koşulda max 100
    return { skip: (page - 1) * limit, take: limit, page, limit };
}
