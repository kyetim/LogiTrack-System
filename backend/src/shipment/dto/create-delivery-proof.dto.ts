import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateDeliveryProofDto {
    @IsString()
    shipmentId: string;

    @IsOptional()
    @IsUrl()
    photoUrl?: string;

    @IsOptional()
    @IsUrl()
    signatureUrl?: string;

    @IsOptional()
    @IsString()
    recipientName?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
