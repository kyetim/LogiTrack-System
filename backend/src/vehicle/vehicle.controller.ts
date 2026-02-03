import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    findAll() {
        return this.vehicleService.findAll();
    }

    @Get('available')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    findAvailable() {
        return this.vehicleService.findAvailable();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    findOne(@Param('id') id: string) {
        return this.vehicleService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createVehicleDto: CreateVehicleDto) {
        return this.vehicleService.create(createVehicleDto);
    }

    @Post(':id/maintenance')
    @Roles(UserRole.ADMIN)
    addMaintenanceLog(@Param('id') id: string, @Body() createLogDto: CreateMaintenanceLogDto) {
        return this.vehicleService.addMaintenanceLog(id, createLogDto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
        return this.vehicleService.update(id, updateVehicleDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.vehicleService.remove(id);
    }

    @Post(':id/drivers')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    assignDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
        return this.vehicleService.assignDriver(id, driverId);
    }

    @Delete(':id/drivers/:driverId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    unassignDriver(@Param('id') id: string, @Param('driverId') driverId: string) {
        return this.vehicleService.unassignDriver(id, driverId);
    }
}
