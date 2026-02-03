import { Module } from '@nestjs/common';
import { RouteOptimizationService } from './route-optimization.service';
import { RouteOptimizationController } from './route-optimization.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [RouteOptimizationController],
    providers: [RouteOptimizationService],
    exports: [RouteOptimizationService],
})
export class RouteOptimizationModule { }
