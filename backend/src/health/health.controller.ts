import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @ApiOperation({ summary: 'Sistem sağlık kontrolü' })
    async check() {
        const checks: Record<string, any> = {};

        // Veritabanı kontrolü
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.database = { status: 'up' };
        } catch {
            checks.database = { status: 'down' };
        }

        // Bellek kontrolü
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
        const usagePct = Math.round((mem.heapUsed / mem.heapTotal) * 100);
        checks.memory = {
            status: usagePct < 85 ? 'up' : 'warning',
            heapUsedMB,
            heapTotalMB,
            usagePercent: `${usagePct}%`,
        };

        // Uygulama bilgisi
        checks.app = {
            status: 'up',
            environment: process.env.NODE_ENV,
            uptime: `${Math.round(process.uptime())}s`,
        };

        const overallStatus = Object.values(checks).every(
            (c: any) => c.status === 'up' || c.status === 'warning',
        )
            ? 'ok'
            : 'error';

        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks,
        };
    }

    @Get('ping')
    @ApiOperation({ summary: 'Basit ping — load balancer için' })
    ping() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
        };
    }
}
