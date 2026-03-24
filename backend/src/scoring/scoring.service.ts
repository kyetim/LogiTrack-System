import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScoringService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get driver score by driver ID
     */
    async getDriverScore(driverId: string) {
        const driver = await this.prisma.driverProfile.findUnique({
            where: { id: driverId },
            include: {
                score: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        if (!driver) {
            throw new NotFoundException('Driver not found');
        }

        // If no score exists, create initial one
        if (!driver.score) {
            return this.prisma.driverScore.create({
                data: {
                    driverId,
                    overallScore: 0,
                    safetyScore: 0,
                    fuelEfficiency: 0,
                    punctualityScore: 0,
                    customerRating: 0,
                },
            });
        }

        return driver.score;
    }

    /**
     * Get driver profile by user ID  
     * Helper method for /drivers/me endpoint
     */
    async getDriverByUserId(userId: string) {
        return this.prisma.driverProfile.findUnique({
            where: { userId },
            select: {
                id: true,
                userId: true,
                licenseNumber: true,
            },
        });
    }


    /**
     * Calculate/Recalculate driver score based on deliveries
     */
    async calculateScore(driverId: string) {
        const driver = await this.prisma.driverProfile.findUnique({
            where: { id: driverId },
        });

        if (!driver) {
            throw new NotFoundException('Driver not found');
        }

        // Get driver's completed shipments
        const shipments = await this.prisma.shipment.findMany({
            where: {
                driverId: driver.userId,
                status: 'DELIVERED',
            },
        });

        const totalDeliveries = shipments.length;

        // Calculate punctuality (delivered on time)
        let onTimeCount = 0;
        shipments.forEach((shipment) => {
            if (
                shipment.estimatedArrival &&
                shipment.updatedAt <= shipment.estimatedArrival
            ) {
                onTimeCount++;
            }
        });

        const punctualityScore =
            totalDeliveries > 0 ? (onTimeCount / totalDeliveries) * 100 : 0;

        // Get existing score or create new
        let score = await this.prisma.driverScore.findUnique({
            where: { driverId },
        });

        if (!score) {
            score = await this.prisma.driverScore.create({
                data: {
                    driverId,
                    totalDeliveries,
                    onTimeDeliveries: onTimeCount,
                    lateDeliveries: totalDeliveries - onTimeCount,
                    punctualityScore,
                    // Default values for other metrics
                    safetyScore: 100, // Start at 100, reduce with incidents
                    fuelEfficiency: 80, // Average default
                    customerRating: 85, // Average default
                    overallScore: 0,
                },
            });
        } else {
            score = await this.prisma.driverScore.update({
                where: { driverId },
                data: {
                    totalDeliveries,
                    onTimeDeliveries: onTimeCount,
                    lateDeliveries: totalDeliveries - onTimeCount,
                    punctualityScore,
                },
            });
        }

        // Calculate overall score (weighted average)
        const overallScore =
            score.punctualityScore * 0.3 +
            score.safetyScore * 0.3 +
            score.fuelEfficiency * 0.2 +
            score.customerRating * 0.2;

        // Update overall score
        const updatedScore = await this.prisma.driverScore.update({
            where: { driverId },
            data: {
                overallScore: Math.round(overallScore),
                lastCalculated: new Date(),
            },
        });

        return updatedScore;
    }

    /**
     * Get leaderboard (top drivers by overall score)
     */
    async getLeaderboard(limit: number = 10) {
        const topDrivers = await this.prisma.driverScore.findMany({
            take: limit,
            orderBy: { overallScore: 'desc' },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                        vehicle: {
                            select: {
                                plateNumber: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });

        return topDrivers.map((score, index) => {
            const s = score as any;
            return {
                rank: index + 1,
                driverId: s.driverId,
                driver: s.driver,
                score: {
                    id: s.id,
                    driverId: s.driverId,
                    overallScore: s.overallScore,
                    safetyScore: s.safetyScore,
                    fuelEfficiency: s.fuelEfficiency,
                    punctualityScore: s.punctualityScore,
                    customerRating: s.customerRating,
                    totalDeliveries: s.totalDeliveries,
                    onTimeDeliveries: s.onTimeDeliveries,
                    lateDeliveries: s.lateDeliveries,
                    lastCalculated: s.lastCalculated,
                    createdAt: s.createdAt, // Fix TS error
                    updatedAt: s.updatedAt, // Fix TS error
                },
            };
        });
    }

    /**
     * Update specific score metrics (for admin adjustments)
     */
    async updateScoreMetrics(
        driverId: string,
        metrics: {
            safetyScore?: number;
            fuelEfficiency?: number;
            customerRating?: number;
            hardBrakingCount?: number;
            rapidAccelCount?: number;
            speedingCount?: number;
        }
    ) {
        const driver = await this.prisma.driverProfile.findUnique({
            where: { id: driverId },
        });

        if (!driver) {
            throw new NotFoundException('Driver not found');
        }

        // Get or create score
        let score = await this.prisma.driverScore.findUnique({
            where: { driverId },
        });

        if (!score) {
            score = await this.prisma.driverScore.create({
                data: {
                    driverId,
                    ...metrics,
                },
            });
        } else {
            score = await this.prisma.driverScore.update({
                where: { driverId },
                data: metrics,
            });
        }

        // Recalculate overall score
        return this.calculateScore(driverId);
    }

    /**
     * Get scoring statistics
     */
    async getStatistics() {
        const [totalDrivers, avgScore, topScore, lowestScore] = await Promise.all([
            this.prisma.driverScore.count(),
            this.prisma.driverScore.aggregate({
                _avg: { overallScore: true },
            }),
            this.prisma.driverScore.aggregate({
                _max: { overallScore: true },
            }),
            this.prisma.driverScore.aggregate({
                _min: { overallScore: true },
            }),
        ]);

        return {
            totalDrivers,
            averageScore: Math.round(avgScore._avg.overallScore || 0),
            topScore: topScore._max.overallScore || 0,
            lowestScore: lowestScore._min.overallScore || 0,
        };
    }
}
