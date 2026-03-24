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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Tüm araçları listele' })
    @ApiResponse({ status: 200, description: 'Araç listesi döner.' })
    findAll() {
        return this.vehicleService.findAll();
    }

    @Get('available')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Müsait (sürücüsüz) araçları listele' })
    @ApiResponse({ status: 200, description: 'Müsait araçlar döner.' })
    findAvailable() {
        return this.vehicleService.findAvailable();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Tekil araç getir' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Araç detayı döner.' })
    findOne(@Param('id') id: string) {
        return this.vehicleService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Yeni araç ekle' })
    @ApiResponse({ status: 201, description: 'Araç oluşturuldu.' })
    create(@Body() createVehicleDto: CreateVehicleDto) {
        return this.vehicleService.create(createVehicleDto);
    }

    @Post(':id/maintenance')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Araça bakım kaydı ekle' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 201, description: 'Bakım kaydı oluşturuldu.' })
    addMaintenanceLog(@Param('id') id: string, @Body() createLogDto: CreateMaintenanceLogDto) {
        return this.vehicleService.addMaintenanceLog(id, createLogDto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Araç bilgilerini güncelle' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Araç güncellendi.' })
    update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
        return this.vehicleService.update(id, updateVehicleDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Araç sil' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Araç silindi.' })
    remove(@Param('id') id: string) {
        return this.vehicleService.remove(id);
    }

    @Post(':id/drivers')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Araça sürücü ata' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Sürücü atandı.' })
    assignDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
        return this.vehicleService.assignDriver(id, driverId);
    }

    @Delete(':id/drivers/:driverId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Araçdan sürücü çıkar' })
    @ApiResponse({ status: 200, description: 'Sürücü ataması kaldırıldı.' })
    unassignDriver(@Param('id') id: string, @Param('driverId') driverId: string) {
        return this.vehicleService.unassignDriver(id, driverId);
    }
}
