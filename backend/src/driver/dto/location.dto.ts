import { IsBoolean, IsLatitude, IsLongitude, IsNumber, IsOptional } from 'class-validator';

export class UpdateLocationDto {
    @IsLatitude()
    lat: number;

    @IsLongitude()
    lng: number;
}

export class SetAvailabilityDto {
    @IsBoolean()
    isAvailable: boolean;
}

export class NearbyShipmentsQueryDto {
    @IsOptional()
    @IsNumber()
    radiusKm?: number = 50;
}
