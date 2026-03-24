import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityType, DocumentType } from '@prisma/client';

export class FilterDocumentDto {
    @ApiPropertyOptional({ enum: EntityType, description: 'Filter by entity type' })
    @IsEnum(EntityType)
    @IsOptional()
    entityType?: EntityType;

    @ApiPropertyOptional({ description: 'Filter by entity ID' })
    @IsString()
    @IsOptional()
    entityId?: string;

    @ApiPropertyOptional({ enum: DocumentType, description: 'Filter by document type' })
    @IsEnum(DocumentType)
    @IsOptional()
    type?: DocumentType;

    @ApiPropertyOptional({ description: 'Filter by verification status' })
    @IsBoolean()
    @IsOptional()
    isVerified?: boolean;

    @ApiPropertyOptional({ description: 'Show only expiring soon (within 30 days)' })
    @IsBoolean()
    @IsOptional()
    expiringSoon?: boolean;
}
