import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityType, DocumentType } from '@prisma/client';

export class UploadDocumentDto {
    @ApiProperty({
        example: 'USER',
        description: 'Entity type',
        enum: EntityType
    })
    @IsEnum(EntityType)
    @IsNotEmpty()
    entityType: EntityType;

    @ApiProperty({ example: 'uuid', description: 'Entity ID' })
    @IsString()
    @IsNotEmpty()
    entityId: string;

    @ApiProperty({
        example: 'DRIVERS_LICENSE',
        description: 'Document type',
        enum: DocumentType
    })
    @IsEnum(DocumentType)
    @IsNotEmpty()
    type: DocumentType;

    @ApiProperty({ example: 'license.pdf', description: 'File name' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiPropertyOptional({ example: 'My Document Title', description: 'User-friendly document title' })
    @IsOptional()
    @IsString()
    displayName?: string;

    @ApiProperty({ example: 'https://...', description: 'File URL' })
    @IsString()
    @IsNotEmpty()
    fileUrl: string;

    @ApiProperty({ example: 1024000, description: 'File size in bytes' })
    @IsNumber()
    @IsNotEmpty()
    fileSize: number;

    @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
    @IsString()
    @IsNotEmpty()
    mimeType: string;

    @ApiPropertyOptional({ description: 'Extracted data from OCR (JSON)' })
    @IsOptional()
    extractedData?: any;

    @ApiPropertyOptional({ example: '2025-12-31', description: 'Document expiry date' })
    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @ApiPropertyOptional({ description: 'Upload location (coordinates)' })
    @IsOptional()
    uploadLocation?: any;
}
