import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ShipmentService } from './shipment.service';
import { WaybillService } from './waybill.service';
import { ShipmentController } from './shipment.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { NotificationModule } from '../notification/notification.module';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [PrismaModule, NotificationModule, FileUploadModule, MulterModule],
  controllers: [ShipmentController],
  providers: [ShipmentService, WaybillService],
  exports: [ShipmentService],
})
export class ShipmentModule { }
