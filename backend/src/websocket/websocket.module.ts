import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { LocationModule } from '../location/location.module';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '15m' },
        }),
        LocationModule,
    ],
    providers: [WebsocketGateway],
    exports: [WebsocketGateway],
})
export class WebsocketModule { }
