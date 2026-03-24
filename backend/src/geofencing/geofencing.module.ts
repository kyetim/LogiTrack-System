import { Module } from '@nestjs/common';
import { GeofencingService } from './geofencing.service';
import { GeofencingController } from './geofencing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { PushNotificationModule } from '../push-notification/push-notification.module';

@Module({
    imports: [PrismaModule, WebsocketModule, PushNotificationModule],
    controllers: [GeofencingController],
    providers: [GeofencingService],
    exports: [GeofencingService],
})
export class GeofencingModule { }
