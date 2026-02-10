import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceDto {
    @ApiProperty({ example: 'INV-2026-001', description: 'Invoice number' })
    @IsString()
    @IsNotEmpty()
    invoiceNumber: string;

    @ApiProperty({ example: 'company-uuid', description: 'Company ID' })
    @IsString()
    @IsNotEmpty()
    companyId: string;

    @ApiPropertyOptional({ example: 'shipment-uuid', description: 'Related shipment ID' })
    @IsString()
    @IsOptional()
    shipmentId?: string;

    @ApiProperty({ example: 5000, description: 'Invoice amount (before tax)' })
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({ example: 900, description: 'Tax amount' })
    @IsNumber()
    @IsNotEmpty()
    taxAmount: number;

    @ApiProperty({ example: 5900, description: 'Total amount (including tax)' })
    @IsNumber()
    @IsNotEmpty()
    totalAmount: number;

    @ApiProperty({ example: '2026-03-05', description: 'Payment due date' })
    @IsDateString()
    @IsNotEmpty()
    dueDate: string;

    @ApiPropertyOptional({ example: 'https://...invoice.pdf', description: 'Invoice PDF URL' })
    @IsString()
    @IsOptional()
    fileUrl?: string;
}
