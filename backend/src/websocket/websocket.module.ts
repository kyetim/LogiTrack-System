import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { JwtModule } from '@nestjs/jwt';
import { LocationModule } from '../location/location.module';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        LocationModule,
    ],
    providers: [WebsocketGateway],
    exports: [WebsocketGateway],
})
export class WebsocketModule { }
