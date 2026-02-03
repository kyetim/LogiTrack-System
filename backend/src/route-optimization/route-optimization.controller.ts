import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { RouteOptimizationService } from './route-optimization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('route-optimization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RouteOptimizationController {
    constructor(private readonly routeOptimizationService: RouteOptimizationService) { }

    @Get('preview/:driverId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    async previewOptimization(@Param('driverId') driverId: string) {
        return this.routeOptimizationService.optimizeDriverRoute(driverId);
    }

    @Post('optimize/:driverId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    async optimizeRoute(@Param('driverId') driverId: string) {
        const result = await this.routeOptimizationService.optimizeDriverRoute(driverId);
        await this.routeOptimizationService.applyOptimization(driverId, result.optimizedOrder);
        return {
            message: 'Route optimized successfully',
            ...result,
        };
    }
}
