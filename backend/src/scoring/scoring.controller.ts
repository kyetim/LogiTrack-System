import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Query,
    Request,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('scoring')
@ApiBearerAuth()
@Controller('scoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScoringController {
    constructor(private readonly scoringService: ScoringService) { }

    @Get('statistics')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get scoring statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    getStatistics() {
        return this.scoringService.getStatistics();
    }

    @Get('leaderboard')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get top drivers leaderboard' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top drivers (default: 10)' })
    @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
    getLeaderboard(@Query('limit') limit?: string) {
        return this.scoringService.getLeaderboard(
            limit ? parseInt(limit, 10) : 10
        );
    }

    @Get('drivers/me')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Get my score (driver only)' })
    @ApiResponse({ status: 200, description: 'Driver score retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Driver not found' })
    async getMyScore(@Request() req) {
        // Get driver profile from user ID
        const driver = await this.scoringService.getDriverByUserId(req.user.id);
        if (!driver) {
            throw new NotFoundException('Driver profile not found');
        }
        return this.scoringService.getDriverScore(driver.id);
    }

    @Get('drivers/:driverId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get driver score by ID' })
    @ApiResponse({ status: 200, description: 'Driver score retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Driver not found' })
    getDriverScore(@Param('driverId') driverId: string) {
        return this.scoringService.getDriverScore(driverId);
    }

    @Post('drivers/:driverId/calculate')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Calculate/Recalculate driver score' })
    @ApiResponse({ status: 200, description: 'Score calculated successfully' })
    @ApiResponse({ status: 404, description: 'Driver not found' })
    calculateScore(@Param('driverId') driverId: string) {
        return this.scoringService.calculateScore(driverId);
    }

    @Patch('drivers/:driverId/metrics')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update driver score metrics (admin only)' })
    @ApiResponse({ status: 200, description: 'Metrics updated successfully' })
    @ApiResponse({ status: 404, description: 'Driver not found' })
    updateMetrics(
        @Param('driverId') driverId: string,
        @Body()
        metrics: {
            safetyScore?: number;
            fuelEfficiency?: number;
            customerRating?: number;
            hardBrakingCount?: number;
            rapidAccelCount?: number;
            speedingCount?: number;
        }
    ) {
        return this.scoringService.updateScoreMetrics(driverId, metrics);
    }
}
