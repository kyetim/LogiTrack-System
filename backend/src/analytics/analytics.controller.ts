import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private prisma: PrismaService) { }

    @Get('dashboard')
    async getDashboardAnalytics(@Query('period') period: string = '7d') {
        const now = new Date();
        let startDate: Date;

        // Calculate start date based on period
        switch (period) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get shipments by day
        const shipments = await this.prisma.shipment.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
            },
        });

        // Group shipments by date
        const shipmentsByDate = this.groupByDate(shipments, startDate, now);

        // Get driver performance
        const drivers = await this.prisma.driverProfile.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        // Get shipments for each driver
        const driverPerformance = await Promise.all(
            drivers.map(async (driver) => {
                const driverShipments = await this.prisma.shipment.findMany({
                    where: {
                        driverId: driver.id,
                        createdAt: {
                            gte: startDate,
                        },
                    },
                });

                return {
                    name: driver.user.email.split('@')[0],
                    completed: driverShipments.filter(s => s.status === 'DELIVERED').length,
                    inTransit: driverShipments.filter(s => s.status === 'IN_TRANSIT').length,
                    total: driverShipments.length,
                };
            })
        );

        const filteredDriverPerformance = driverPerformance.filter(d => d.total > 0);

        // Get status distribution
        const statusDistribution = {
            PENDING: shipments.filter(s => s.status === 'PENDING').length,
            IN_TRANSIT: shipments.filter(s => s.status === 'IN_TRANSIT').length,
            DELIVERED: shipments.filter(s => s.status === 'DELIVERED').length,
            CANCELLED: shipments.filter(s => s.status === 'CANCELLED').length,
        };

        return {
            period,
            shipmentsByDate,
            driverPerformance,
            statusDistribution,
            summary: {
                totalShipments: shipments.length,
                completedShipments: shipments.filter(s => s.status === 'DELIVERED').length,
                activeShipments: shipments.filter(s => s.status === 'IN_TRANSIT').length,
                completionRate: shipments.length > 0
                    ? Math.round((shipments.filter(s => s.status === 'DELIVERED').length / shipments.length) * 100)
                    : 0,
            },
        };
    }

    private groupByDate(shipments: any[], startDate: Date, endDate: Date) {
        const dateMap = new Map<string, any>();

        // Initialize all dates with 0
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dateMap.set(dateKey, {
                date: dateKey,
                total: 0,
                delivered: 0,
                inTransit: 0,
                pending: 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count shipments per date
        shipments.forEach(shipment => {
            const dateKey = shipment.createdAt.toISOString().split('T')[0];
            const data = dateMap.get(dateKey);
            if (data) {
                data.total++;
                if (shipment.status === 'DELIVERED') data.delivered++;
                if (shipment.status === 'IN_TRANSIT') data.inTransit++;
                if (shipment.status === 'PENDING') data.pending++;
            }
        });

        return Array.from(dateMap.values());
    }
}
