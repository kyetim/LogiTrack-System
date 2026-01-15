import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, DriverStatus } from '@prisma/client';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverController {
    constructor(private readonly driverService: DriverService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    findAll(
        @Query('isActive') isActive?: string,
        @Query('status') status?: DriverStatus,
        @Query('vehicleId') vehicleId?: string,
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }

        if (status) {
            filters.status = status;
        }

        if (vehicleId) {
            filters.vehicleId = vehicleId;
        }

        return this.driverService.findAll(filters);
    }

    @Get('active')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    getActiveDrivers() {
        return this.driverService.getActiveDrivers();
    }

    @Get('me')
    @Roles(UserRole.DRIVER)
    async getMyProfile(@Request() req) {
        const driver = await this.driverService.findByUserId(req.user.id);
        if (!driver) {
            throw new ForbiddenException('Driver profile not found');
        }
        return driver;
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async findOne(@Param('id') id: string, @Request() req) {
        const driver = await this.driverService.findOne(id);

        // Drivers can only see their own profile
        if (req.user.role === UserRole.DRIVER) {
            const userDriver = await this.driverService.findByUserId(req.user.id);
            if (!userDriver || userDriver.id !== id) {
                throw new ForbiddenException('You can only access your own profile');
            }
        }

        return driver;
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createDriverDto: CreateDriverDto) {
        return this.driverService.create(createDriverDto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.DRIVER)
    async update(
        @Param('id') id: string,
        @Body() updateDriverDto: UpdateDriverDto,
        @Request() req,
    ) {
        // Drivers can only update their own profile
        if (req.user.role === UserRole.DRIVER) {
            const userDriver = await this.driverService.findByUserId(req.user.id);
            if (!userDriver || userDriver.id !== id) {
                throw new ForbiddenException('You can only update your own profile');
            }
        }

        return this.driverService.update(id, updateDriverDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.driverService.remove(id);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMIN, UserRole.DRIVER)
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: DriverStatus,
        @Request() req,
    ) {
        // Drivers can only update their own status
        if (req.user.role === UserRole.DRIVER) {
            const userDriver = await this.driverService.findByUserId(req.user.id);
            if (!userDriver || userDriver.id !== id) {
                throw new ForbiddenException('You can only update your own status');
            }
        }

        return this.driverService.updateStatus(id, status);
    }

    @Patch(':id/vehicle')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    assignVehicle(@Param('id') id: string, @Body('vehicleId') vehicleId: string) {
        return this.driverService.assignVehicle(id, vehicleId);
    }
}
