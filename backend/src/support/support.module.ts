import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SupportController],
    providers: [SupportService],
    exports: [SupportService], // Export for potential use in WebSocket gateway
})
export class SupportModule { }
