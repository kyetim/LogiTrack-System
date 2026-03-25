import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
    }

    async onModuleInit() {
        await this.$connect();

        // Prisma v6 does not support $use middleware.
        // Soft delete logic should be rebuilt using Client Extensions ($extends) or explicit filters.
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
