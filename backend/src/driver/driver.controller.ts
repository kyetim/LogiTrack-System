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
    StreamableFile,
    Header,
} from '@nestjs/common';
import * as xlsx from 'xlsx';

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
    async getActiveDrivers() {
        const drivers = await this.driverService.getActiveDrivers();
        console.log('📍 Active drivers with location:', JSON.stringify(drivers, null, 2));

        // Clean response after debugging
        return drivers;
    }

    @Get('export')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @Header('Content-Disposition', 'attachment; filename="drivers.xlsx"')
    async exportDrivers(
        @Query('isActive') isActive?: string,
        @Query('status') status?: DriverStatus,
        @Query('vehicleId') vehicleId?: string,
    ) {
        const filters: any = {};
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        if (status) filters.status = status;
        if (vehicleId) filters.vehicleId = vehicleId;

        const drivers = await this.driverService.findAll(filters);

        const exportData = drivers.map(d => ({
            ID: d.id,
            Email: d.user?.email || 'N/A',
            License_Number: d.licenseNumber,
            Status: d.status,
            Is_Active: d.isActive ? 'Evet' : 'Hayır',
            Vehicle_Plate: d.vehicle?.plateNumber || 'Atanmamış',
            Created_At: d.createdAt
        }));

        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Drivers');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return new StreamableFile(buffer);
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

    @Patch('me/availability')
    @Roles(UserRole.DRIVER)
    async updateMyAvailability(
        @Request() req,
        @Body() availabilityDto: { status: 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY' },
    ) {
        const driver = await this.driverService.findByUserId(req.user.id);
        if (!driver) {
            throw new ForbiddenException('Driver profile not found');
        }

        // Map frontend status to backend status + isAvailable
        let driverStatus: DriverStatus;
        let isAvailable: boolean;

        switch (availabilityDto.status) {
            case 'AVAILABLE':
                driverStatus = DriverStatus.ON_DUTY;
                isAvailable = true;
                break;
            case 'ON_DUTY':
                driverStatus = DriverStatus.ON_DUTY;
                isAvailable = false; // On duty but busy
                break;
            case 'OFF_DUTY':
                driverStatus = DriverStatus.OFF_DUTY;
                isAvailable = false;
                break;
        }

        // Update both status and isAvailable
        return this.driverService.updateStatusAndAvailability(
            driver.id,
            driverStatus,
            isAvailable
        );
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

    // ============================================
    // DRIVER AVAILABILITY ENDPOINTS (Internal Fleet)
    // ============================================

    @Get('availability/summary')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    getAvailabilitySummary() {
        return this.driverService.getAvailabilitySummary();
    }

    @Get('availability/available')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    getAvailableDrivers() {
        return this.driverService.getAvailableDrivers();
    }

    @Patch(':id/availability')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async updateAvailability(
        @Param('id') id: string,
        @Body() availabilityDto: {
            isAvailable?: boolean;
            currentLoadCapacity?: number;
            preferredRoutes?: any;
        },
        @Request() req,
    ) {
        // Drivers can only update their own availability
        if (req.user.role === UserRole.DRIVER) {
            const userDriver = await this.driverService.findByUserId(req.user.id);
            if (!userDriver || userDriver.id !== id) {
                throw new ForbiddenException('You can only update your own availability');
            }
        }

        return this.driverService.updateAvailability(id, availabilityDto);
    }

    // ============================================
    // LOCATION TRACKING & JOB MATCHING (New)
    // ============================================

    @Post('me/location')
    @Roles(UserRole.DRIVER)
    async updateMyLocation(
        @Request() req,
        @Body() locationDto: { lat: number; lng: number }
    ) {
        const driver = await this.driverService.findByUserId(req.user.id);
        if (!driver) {
            throw new ForbiddenException('Driver profile not found');
        }

        return this.driverService.updateDriverLocation(
            driver.id,
            locationDto.lat,
            locationDto.lng
        );
    }

    @Post('me/availability-for-work')
    @Roles(UserRole.DRIVER)
    async setMyAvailabilityForWork(
        @Request() req,
        @Body() availabilityDto: { isAvailable: boolean }
    ) {
        const driver = await this.driverService.findByUserId(req.user.id);
        if (!driver) {
            throw new ForbiddenException('Driver profile not found');
        }

        return this.driverService.setAvailabilityForWork(
            driver.id,
            availabilityDto.isAvailable
        );
    }
}

