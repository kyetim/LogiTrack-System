import { IsNotEmpty, IsUUID, IsObject, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateLocationDto {
    @IsUUID()
    @IsNotEmpty()
    driverId: string;

    @IsObject()
    @IsNotEmpty()
    coordinates: {
        lat: number;
        lng: number;
    };

    @IsNumber()
    @IsOptional()
    @Min(0)
    speed?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(360)
    heading?: number;

    @IsOptional()
    timestamp?: Date | string;
}
