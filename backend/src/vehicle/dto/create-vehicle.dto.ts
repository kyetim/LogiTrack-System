import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    plateNumber: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    capacity: number;

    @IsString()
    @IsNotEmpty()
    type: string;
}
