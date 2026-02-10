import { Module } from '@nestjs/common';
import { GeofencingService } from './geofencing.service';
import { GeofencingController } from './geofencing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GeofencingController],
    providers: [GeofencingService],
    exports: [GeofencingService],
})
export class GeofencingModule { }
