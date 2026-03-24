export class LocationResponseDto {
    id: string;
    driverId: string;
    coordinates: any;
    heading: number | null;
    speed: number | null;
    timestamp: Date;
    driver?: {
        id: string;
        licenseNumber: string;
        user: {
            email: string;
        };
    };
}
