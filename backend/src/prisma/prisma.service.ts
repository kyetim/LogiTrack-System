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

        this.$use(async (params, next) => {
            // Soft delete filtresi — sadece aktif kayıtları getir
            const modelsWithSoftDelete = ['User', 'Shipment'];

            if (modelsWithSoftDelete.includes(params.model)) {
                if (params.action === 'findUnique' || params.action === 'findFirst') {
                    params.action = 'findFirst';
                    if (params.args.where?.deletedAt === undefined) {
                        params.args.where = { ...params.args.where, deletedAt: null };
                    }
                }
                if (params.action === 'findMany') {
                    params.args = params.args || {};
                    if (params.args.where?.deletedAt === undefined) {
                        params.args.where = { ...params.args.where, deletedAt: null };
                    }
                }
            }
            return next(params);
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
