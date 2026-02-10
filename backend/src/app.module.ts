import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DriverModule } from './driver/driver.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { ShipmentModule } from './shipment/shipment.module';
import { LocationModule } from './location/location.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MqttModule } from './mqtt/mqtt.module';
import { UploadModule } from './upload/upload.module';
import { WebsocketModule } from './websocket/websocket.module';
import { NotificationModule } from './notification/notification.module';
import { RouteOptimizationModule } from './route-optimization/route-optimization.module';
import { CompanyModule } from './company/company.module';
import { GeofencingModule } from './geofencing/geofencing.module';
import { DocumentModule } from './document/document.module';
import { MessagingModule } from './messaging/messaging.module';
import { ScoringModule } from './scoring/scoring.module';
import { BillingModule } from './billing/billing.module';
import { PushNotificationModule } from './push-notification/push-notification.module';
import { EmailModule } from './email/email.module';
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL) || 60000,
      limit: parseInt(process.env.THROTTLE_LIMIT) || 10,
    }]),

    // Database
    PrismaModule,

    // Features
    AuthModule,

    UserModule,

    DriverModule,

    VehicleModule,

    ShipmentModule,

    LocationModule,
    AnalyticsModule,
    MqttModule,
    UploadModule,
    WebsocketModule,
    NotificationModule,
    RouteOptimizationModule,

    // TIRPORT Features
    CompanyModule,
    GeofencingModule,
    DocumentModule,
    MessagingModule,
    ScoringModule,
    BillingModule,
    PushNotificationModule,

    // Global Services
    EmailModule,
    FileUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
