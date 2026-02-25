import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Query,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('locations')
@ApiBearerAuth()
@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

    @Get('latest')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Tüm sörücülerin en son konumlarını getir' })
    @ApiResponse({ status: 200, description: 'Son konum listesi döner.' })
    async getLatestLocations() {
        return this.locationService.getLatestLocations();
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Konum geçmişini listele' })
    @ApiQuery({ name: 'driverId', required: false, type: String })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiResponse({ status: 200, description: 'GPS log listesi döner.' })
    findAll(
        @Query('driverId') driverId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const filters: any = {};

        if (driverId) {
            filters.driverId = driverId;
        }

        if (startDate) {
            filters.startDate = new Date(startDate);
        }

        if (endDate) {
            filters.endDate = new Date(endDate);
        }

        return this.locationService.findAll(filters);
    }

    @Get('driver/:driverId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async findByDriver(
        @Param('driverId') driverId: string,
        @Query('limit') limit?: string,
        @Request() req?,
    ) {
        // Drivers can only see their own locations
        if (req.user.role === UserRole.DRIVER) {
            const userDriver = await this.locationService['prisma'].driverProfile.findUnique({
                where: { userId: req.user.id },
            });

            if (!userDriver || userDriver.id !== driverId) {
                throw new ForbiddenException('You can only access your own locations');
            }
        }

        return this.locationService.findByDriver(driverId, limit ? parseInt(limit) : 50);
    }

    @Get('driver/:driverId/latest')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async getLatestLocation(@Param('driverId') driverId: string, @Request() req) {
        // Drivers can only see their own latest location
        if (req.user.role === UserRole.DRIVER) {
            const userDriver = await this.locationService['prisma'].driverProfile.findUnique({
                where: { userId: req.user.id },
            });

            if (!userDriver || userDriver.id !== driverId) {
                throw new ForbiddenException('You can only access your own location');
            }
        }

        return this.locationService.getLatestLocation(driverId);
    }

    @Post()
    @Roles(UserRole.DRIVER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Sürücü konum güncelle (GPS update)' })
    @ApiResponse({ status: 201, description: 'Konum kaydedildi.' })
    async create(@Body() createLocationDto: CreateLocationDto, @Request() req: any) {
        // Drivers can only create their own locations
        if (req.user.role === UserRole.DRIVER) {
            const userDriver = await this.locationService['prisma'].driverProfile.findUnique({
                where: { userId: req.user.id },
            });

            if (!userDriver || userDriver.id !== createLocationDto.driverId) {
                throw new ForbiddenException('You can only log your own location');
            }
        }

        return this.locationService.create(createLocationDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.locationService.remove(id);
    }
}
