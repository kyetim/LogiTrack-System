import { IsNotEmpty, IsObject, IsOptional, IsDateString } from 'class-validator';

export class CreateShipmentDto {
    @IsObject()
    @IsNotEmpty()
    pickupLocation: {
        lat: number;
        lng: number;
        address: string;
    };

    @IsObject()
    @IsNotEmpty()
    deliveryLocation: {
        lat: number;
        lng: number;
        address: string;
    };

    @IsDateString()
    @IsOptional()
    estimatedArrival?: string;
}
