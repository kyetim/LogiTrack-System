import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, InvoiceStatus } from '@prisma/client';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Create a new invoice' })
    @ApiResponse({ status: 201, description: 'Invoice created successfully' })
    @ApiResponse({ status: 409, description: 'Invoice number already exists' })
    create(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.billingService.create(createInvoiceDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.COMPANY_OWNER)
    @ApiOperation({ summary: 'Get all invoices with filters' })
    @ApiQuery({ name: 'companyId', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
    @ApiQuery({ name: 'overdue', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
    findAll(
        @Query('companyId') companyId?: string,
        @Query('status') status?: InvoiceStatus,
        @Query('overdue') overdue?: string,
    ) {
        const filters: any = {};
        if (companyId) filters.companyId = companyId;
        if (status) filters.status = status;
        if (overdue === 'true') filters.overdue = true;

        return this.billingService.findAll(filters);
    }

    @Get('statistics')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get billing statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    getStatistics() {
        return this.billingService.getStatistics();
    }

    @Get('overdue')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get overdue invoices' })
    @ApiResponse({ status: 200, description: 'Overdue invoices retrieved successfully' })
    getOverdueInvoices() {
        return this.billingService.getOverdueInvoices();
    }

    @Get('generate-number')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Generate next invoice number' })
    @ApiResponse({ status: 200, description: 'Invoice number generated' })
    generateInvoiceNumber() {
        return this.billingService.generateInvoiceNumber();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.COMPANY_OWNER)
    @ApiOperation({ summary: 'Get invoice by ID' })
    @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Invoice not found' })
    findOne(@Param('id') id: string) {
        return this.billingService.findOne(id);
    }

    @Patch(':id/pay')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Mark invoice as paid' })
    @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
    @ApiResponse({ status: 404, description: 'Invoice not found' })
    @ApiResponse({ status: 409, description: 'Invoice already paid' })
    markAsPaid(@Param('id') id: string) {
        return this.billingService.markAsPaid(id);
    }

    @Patch(':id/cancel')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Cancel an invoice' })
    @ApiResponse({ status: 200, description: 'Invoice cancelled successfully' })
    @ApiResponse({ status: 404, description: 'Invoice not found' })
    @ApiResponse({ status: 409, description: 'Cannot cancel paid invoice' })
    cancel(@Param('id') id: string) {
        return this.billingService.cancel(id);
    }
}
