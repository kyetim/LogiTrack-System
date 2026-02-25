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
    BadRequestException,
    Res,
    UseInterceptors,
    UploadedFile,
    StreamableFile,
    Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import * as xlsx from 'xlsx';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { ShipmentService } from './shipment.service';
import { WaybillService } from './waybill.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ShipmentStatus } from '@prisma/client';

@ApiTags('shipments')
@ApiBearerAuth()
@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentController {
    constructor(
        private readonly shipmentService: ShipmentService,
        private readonly waybillService: WaybillService
    ) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Tüm sevkiyatları listele (filtreli)' })
    @ApiQuery({ name: 'status', required: false, enum: ShipmentStatus })
    @ApiQuery({ name: 'driverId', required: false, type: String })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Sevkiyat listesi döner.' })
    findAll(
        @Query('status') status?: ShipmentStatus,
        @Query('driverId') driverId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const filters: any = {};

        if (status) {
            filters.status = status;
        }

        if (driverId) {
            filters.driverId = driverId;
        }

        if (startDate) {
            filters.startDate = new Date(startDate);
        }

        if (endDate) {
            filters.endDate = new Date(endDate);
        }

        return this.shipmentService.findAll(filters);
    }

    @Get('export')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @Header('Content-Disposition', 'attachment; filename="shipments.xlsx"')
    async exportShipments(
        @Query('status') status?: ShipmentStatus,
        @Query('driverId') driverId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const filters: any = {};
        if (status) filters.status = status;
        if (driverId) filters.driverId = driverId;
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const shipments = await this.shipmentService.findAll(filters);

        const exportData = shipments.map(s => ({
            ID: s.id,
            Tracking_Number: s.trackingNumber,
            Status: s.status,
            Origin: s.origin,
            Destination: s.destination,
            Estimated_Arrival: s.estimatedArrival || 'N/A',
            Driver: s.driver ? s.driver.email : 'Atanmamış',
            Created_At: s.createdAt
        }));

        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Shipments');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return new StreamableFile(buffer);
    }

    @Get('my')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Sürucün kendi sevkiyatlarını getir' })
    @ApiResponse({ status: 200, description: 'Atanmış sevkiyatlar döner.' })
    async getMyShipments(@Request() req: any) {
        // Get driver profile for the authenticated user
        const driverProfile = await this.shipmentService['prisma'].driverProfile.findUnique({
            where: { userId: req.user.id },
        });

        if (!driverProfile) {
            throw new ForbiddenException('You do not have a driver profile');
        }

        return this.shipmentService.findByDriver(req.user.id);
    }

    @Get('nearby')
    @Roles(UserRole.DRIVER)
    async getNearbyShipments(
        @Request() req,
        @Query('radius') radius?: number
    ) {
        // Get driver profile for authenticated user
        const driverProfile = await this.shipmentService['prisma'].driverProfile.findUnique({
            where: { userId: req.user.id },
        });

        if (!driverProfile) {
            throw new ForbiddenException('Driver profile not found');
        }

        const radiusKm = radius ? Number(radius) : 50;
        return this.shipmentService.findNearbyShipments(driverProfile.id, radiusKm);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Tekil sevkiyatı getir' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Sevkiyat detayı döner.' })
    @ApiResponse({ status: 403, description: 'Sürucü kendi sevkiyatına erişebilir.' })
    async findOne(@Param('id') id: string, @Request() req: any) {
        const shipment = await this.shipmentService.findOne(id);

        // Drivers can only see their own shipments
        if (req.user.role === UserRole.DRIVER && shipment.driverId !== req.user.id) {
            throw new ForbiddenException('You can only access your own shipments');
        }

        return shipment;
    }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Yeni sevkiyat oluştur' })
    @ApiResponse({ status: 201, description: 'Sevkiyat başarıyla oluşturuldu.' })
    create(@Body() createShipmentDto: CreateShipmentDto) {
        return this.shipmentService.create(createShipmentDto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    update(@Param('id') id: string, @Body() updateShipmentDto: UpdateShipmentDto) {
        return this.shipmentService.update(id, updateShipmentDto);
    }

    @Patch(':id/assign')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Sevkiyata sürücü ata' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Sürücü atandı.' })
    assignDriver(@Param('id') id: string, @Body() assignDriverDto: AssignDriverDto) {
        return this.shipmentService.assignDriver(id, assignDriverDto.driverId);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateStatusDto,
        @Request() req,
    ) {
        const shipment = await this.shipmentService.findOne(id);

        // Drivers can only update their own shipments
        if (req.user.role === UserRole.DRIVER && shipment.driverId !== req.user.id) {
            throw new ForbiddenException('You can only update your own shipments');
        }

        // Only ADMIN can cancel shipments
        if (updateStatusDto.status === ShipmentStatus.CANCELLED && req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can cancel shipments');
        }

        return this.shipmentService.updateStatus(id, updateStatusDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.shipmentService.remove(id);
    }

    // Delivery Proof Endpoints
    @Post(':id/delivery-proof')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Teslimat kanıtı oluştur (fotoğraf + imza)' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 201, description: 'Teslimat kanıtı kaydedildi.' })
    async createDeliveryProof(
        @Param('id') id: string,
        @Body() data: { photoUrl?: string; signatureUrl?: string; recipientName?: string; notes?: string },
        @Request() req: any,
    ) {
        // Verify driver owns this shipment
        const shipment = await this.shipmentService.findOne(id);
        if (shipment.driverId !== req.user.id) {
            throw new ForbiddenException('You can only create delivery proof for your own shipments');
        }

        return this.shipmentService.createDeliveryProof(id, data);
    }

    @Get(':id/delivery-proof')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async getDeliveryProof(@Param('id') id: string, @Request() req) {
        // Verify access
        const shipment = await this.shipmentService.findOne(id);
        if (req.user.role === UserRole.DRIVER && shipment.driverId !== req.user.id) {
            throw new ForbiddenException('You can only access delivery proof for your own shipments');
        }

        return this.shipmentService.getDeliveryProof(id);
    }

    @Get(':id/waybill')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async getWaybill(@Param('id') id: string, @Request() req, @Res() res: Response) {
        // Verify access (Driver can only see their own - simplified check)
        const shipment = await this.shipmentService.findOne(id);

        if (req.user.role === UserRole.DRIVER && shipment.driverId !== req.user.id) {
            throw new ForbiddenException('You can only access waybill for your own shipments');
        }

        // If manual waybill uploaded, serve it
        if (shipment.waybillUrl) {
            const filename = shipment.waybillUrl.split('/').pop();
            const filePath = join(process.cwd(), 'uploads', 'documents', filename);

            if (fs.existsSync(filePath)) {
                res.sendFile(filePath);
                return;
            }
        }

        const buffer = await this.waybillService.generateWaybill(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=waybill-${shipment.trackingNumber}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @Post(':id/upload-waybill')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @UseInterceptors(FileInterceptor('file'))
    async uploadWaybill(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return this.shipmentService.uploadManualWaybill(id, file);
    }
}
