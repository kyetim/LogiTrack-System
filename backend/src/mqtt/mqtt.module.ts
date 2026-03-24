import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { LocationModule } from '../location/location.module';

@Module({
    imports: [WebsocketModule, LocationModule],
    providers: [MqttService],
    exports: [MqttService],
})
export class MqttModule { }
