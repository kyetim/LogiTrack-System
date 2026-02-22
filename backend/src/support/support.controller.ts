import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, TicketStatus } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddInternalNoteDto } from './dto/add-internal-note.dto';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
    constructor(
        private readonly supportService: SupportService,
        private readonly wsGateway: WebsocketGateway,
    ) { }

    // ==================== DRIVER ENDPOINTS ====================

    @Get('my-ticket')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Get driver\'s active support ticket (null if none)' })
    @ApiResponse({ status: 200, description: 'Active ticket with messages or null' })
    async getMyTicket(@Request() req) {
        return this.supportService.getDriverTicket(req.user.id);
    }

    @Get('my-ticket/history')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Get driver\'s closed/resolved ticket history' })
    @ApiResponse({ status: 200, description: 'List of past tickets' })
    async getMyTicketHistory(@Request() req) {
        return this.supportService.getDriverTicketHistory(req.user.id);
    }

    @Post('my-ticket/messages')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Send message to support ticket' })
    @ApiResponse({ status: 201, description: 'Message sent successfully' })
    async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
        return this.supportService.sendDriverMessage(req.user.id, sendMessageDto);
    }

    @Patch('my-ticket/close')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Close active support ticket' })
    @ApiResponse({ status: 200, description: 'Ticket closed successfully' })
    async closeMyTicket(@Request() req) {
        return this.supportService.closeDriverTicket(req.user.id);
    }

    @Post('emergency')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Create URGENT emergency support ticket (accident, etc.)' })
    @ApiResponse({ status: 201, description: 'Emergency ticket created, phone number provided' })
    async createEmergency(@Request() req, @Body() body: { location?: string }) {
        return this.supportService.createEmergencyTicket(req.user.id, body.location);
    }

    //==================== ADMIN/DISPATCHER ENDPOINTS ====================

    @Get('tickets')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get all support tickets (with filters)' })
    @ApiResponse({ status: 200, description: 'List of tickets' })
    async getAllTickets(
        @Request() req,
        @Query('status') status?: TicketStatus,
        @Query('assignedToMe') assignedToMe?: string,
    ) {
        const filters = {
            status,
            assignedToMe: assignedToMe === 'true',
        };
        return this.supportService.getAllTickets(filters, req.user.id);
    }

    @Get('tickets/:id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get ticket detail' })
    @ApiResponse({ status: 200, description: 'Ticket details' })
    async getTicket(@Param('id') id: string, @Request() req) {
        return this.supportService.getTicket(id, req.user.id, req.user.role);
    }

    @Patch('tickets/:id/assign')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Assign ticket to current user' })
    @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
    async assignTicket(@Param('id') id: string, @Request() req) {
        return this.supportService.assignTicket(id, req.user.id);
    }

    @Post('tickets/:id/messages')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Reply to support ticket' })
    @ApiResponse({ status: 201, description: 'Reply sent successfully' })
    async replyToTicket(
        @Param('id') id: string,
        @Request() req,
        @Body() sendMessageDto: SendMessageDto,
    ) {
        const message = await this.supportService.sendAdminReply(id, req.user.id, sendMessageDto);
        // Push real-time notification to the driver's app
        this.wsGateway.server.to('drivers').emit('support:admin-reply', {
            ticketId: id,
            message,
        });
        return message;
    }

    @Post('tickets/:id/internal-note')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Add internal note (driver will not see)' })
    @ApiResponse({ status: 201, description: 'Internal note added' })
    async addInternalNote(
        @Param('id') id: string,
        @Request() req,
        @Body() noteDto: AddInternalNoteDto,
    ) {
        return this.supportService.addInternalNote(id, req.user.id, noteDto);
    }

    @Patch('tickets/:id/status')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Update ticket status' })
    @ApiResponse({ status: 200, description: 'Ticket status updated' })
    async updateTicketStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateTicketStatusDto,
    ) {
        return this.supportService.updateTicketStatus(id, updateStatusDto);
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get support statistics' })
    @ApiResponse({ status: 200, description: 'Support statistics' })
    async getStats() {
        return this.supportService.getStats();
    }
}
