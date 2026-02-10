import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GeofencingService } from './geofencing.service';
import { CreateGeofenceDto } from './dto/create-geofence.dto';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';
import { CheckLocationDto } from './dto/check-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, GeofenceEventType } from '@prisma/client';

@ApiTags('geofencing')
@ApiBearerAuth()
@Controller('geofencing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeofencingController {
    constructor(private readonly geofencingService: GeofencingService) { }

    @Post('geofences')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Create a new geofence zone' })
    @ApiResponse({ status: 201, description: 'Geofence created successfully' })
    create(@Body() createGeofenceDto: CreateGeofenceDto) {
        return this.geofencingService.create(createGeofenceDto);
    }

    @Get('geofences')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get all geofences' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'type', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Geofences retrieved successfully' })
    findAll(
        @Query('isActive') isActive?: string,
        @Query('type') type?: string
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }

        if (type) {
            filters.type = type;
        }

        return this.geofencingService.findAll(filters);
    }

    @Get('geofences/:id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get geofence by ID' })
    @ApiResponse({ status: 200, description: 'Geofence retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Geofence not found' })
    findOne(@Param('id') id: string) {
        return this.geofencingService.findOne(id);
    }

    @Get('geofences/:id/statistics')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get geofence statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    getStatistics(@Param('id') id: string) {
        return this.geofencingService.getGeofenceStatistics(id);
    }

    @Patch('geofences/:id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Update a geofence' })
    @ApiResponse({ status: 200, description: 'Geofence updated successfully' })
    @ApiResponse({ status: 404, description: 'Geofence not found' })
    update(@Param('id') id: string, @Body() updateGeofenceDto: UpdateGeofenceDto) {
        return this.geofencingService.update(id, updateGeofenceDto);
    }

    @Delete('geofences/:id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a geofence' })
    @ApiResponse({ status: 200, description: 'Geofence deleted successfully' })
    @ApiResponse({ status: 404, description: 'Geofence not found' })
    remove(@Param('id') id: string) {
        return this.geofencingService.remove(id);
    }

    @Post('check')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Check if location is within any geofence' })
    @ApiResponse({
        status: 200,
        description: 'Location checked successfully',
        schema: {
            example: {
                location: { lat: 41.0082, lng: 28.9784 },
                isInsideAnyGeofence: true,
                matchedGeofences: []
            }
        }
    })
    checkLocation(@Body() checkLocationDto: CheckLocationDto) {
        return this.geofencingService.checkLocation(checkLocationDto);
    }

    @Get('events')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get geofence events history' })
    @ApiQuery({ name: 'driverId', required: false, type: String })
    @ApiQuery({ name: 'geofenceId', required: false, type: String })
    @ApiQuery({ name: 'eventType', required: false, enum: GeofenceEventType })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
    getEvents(
        @Query('driverId') driverId?: string,
        @Query('geofenceId') geofenceId?: string,
        @Query('eventType') eventType?: GeofenceEventType,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const filters: any = {};

        if (driverId) filters.driverId = driverId;
        if (geofenceId) filters.geofenceId = geofenceId;
        if (eventType) filters.eventType = eventType;
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        return this.geofencingService.getEvents(filters);
    }
}
