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

    @Get('detailed')
    async getDetailedAnalytics(@Query('period') period: string = '7d') {
        const now = new Date();
        let startDate: Date;

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

        // Fetch drivers
        const drivers = await this.prisma.driverProfile.findMany({
            include: {
                user: { select: { email: true } },
                vehicle: { select: { plateNumber: true } },
            },
        });

        // Calculate stats per driver
        const leaderboard = await Promise.all(
            drivers.map(async (driver) => {
                // Get location logs for distance calculation
                const logs = await this.prisma.locationLog.findMany({
                    where: {
                        driverId: driver.id,
                        timestamp: { gte: startDate },
                    },
                    orderBy: { timestamp: 'asc' },
                    select: { coordinates: true, speed: true },
                });

                // Calculate total distance
                let totalDistance = 0;
                let totalSpeed = 0;
                let speedCount = 0;

                for (let i = 0; i < logs.length - 1; i++) {
                    const coord1 = logs[i].coordinates as any;
                    const coord2 = logs[i + 1].coordinates as any;

                    if (coord1.latitude && coord1.longitude && coord2.latitude && coord2.longitude) {
                        totalDistance += this.getDistanceFromLatLonInKm(
                            coord1.latitude, coord1.longitude,
                            coord2.latitude, coord2.longitude
                        );
                    }

                    if (logs[i].speed !== null) {
                        totalSpeed += logs[i].speed;
                        speedCount++;
                    }
                }

                // Get shipment stats
                const shipmentStats = await this.prisma.shipment.aggregate({
                    where: {
                        driverId: driver.id,
                        createdAt: { gte: startDate },
                    },
                    _count: { id: true },
                });

                const completedShipments = await this.prisma.shipment.count({
                    where: {
                        driverId: driver.id,
                        status: 'DELIVERED',
                        createdAt: { gte: startDate },
                    }
                });

                return {
                    id: driver.id,
                    name: driver.user.email.split('@')[0],
                    plateNumber: driver.vehicle?.plateNumber || 'N/A',
                    totalDistance: Math.round(totalDistance * 100) / 100, // km
                    averageSpeed: speedCount > 0 ? Math.round(totalSpeed / speedCount) : 0, // km/h
                    totalShipments: shipmentStats._count.id,
                    completedShipments: completedShipments,
                    score: completedShipments * 10 + Math.round(totalDistance), // Simple score algorithm
                };
            })
        );

        // Sort by score (descending)
        leaderboard.sort((a, b) => b.score - a.score);

        // Fleet Totals
        const fleetStats = {
            totalDistance: leaderboard.reduce((sum, d) => sum + d.totalDistance, 0),
            averageSpeed: leaderboard.length > 0
                ? Math.round(leaderboard.reduce((sum, d) => sum + d.averageSpeed, 0) / leaderboard.length)
                : 0,
            activeDrivers: leaderboard.filter(d => d.totalDistance > 0).length,
        };

        return {
            period,
            fleetStats,
            leaderboard,
        };
    }

    private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180);
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
