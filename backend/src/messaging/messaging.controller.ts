import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('messaging')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingController {
    constructor(
        private readonly messagingService: MessagingService,
        private readonly messagingGateway: MessagingGateway,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Send a new message' })
    @ApiResponse({ status: 201, description: 'Message sent successfully' })
    @ApiResponse({ status: 404, description: 'Recipient not found' })
    async sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req) {
        const message = await this.messagingService.sendMessage(req.user.id, sendMessageDto);
        this.messagingGateway.notifyRecipient(message);
        return message;
    }

    @Get('inbox')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get inbox (received messages)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Inbox retrieved successfully' })
    getInbox(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.messagingService.getInbox(
            req.user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 50,
        );
    }

    @Get('sent')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get sent messages' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Sent messages retrieved successfully' })
    getSentMessages(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.messagingService.getSentMessages(
            req.user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 50,
        );
    }

    @Get('conversations')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get list of all conversations' })
    @ApiResponse({
        status: 200,
        description: 'Conversations list with last message and unread count',
    })
    getConversationsList(@Request() req) {
        return this.messagingService.getConversationsList(req.user.id);
    }

    @Get('conversation/:userId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get conversation with specific user' })
    @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
    getConversation(@Param('userId') userId: string, @Request() req) {
        const result = this.messagingService.getConversation(req.user.id, userId);
        // Notify that we read the conversation (since service marks it as read)
        this.messagingGateway.notifyConversationRead(req.user.id, userId);
        return result;
    }

    @Get('unread-count')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get unread message count' })
    @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
    getUnreadCount(@Request() req) {
        return this.messagingService.getUnreadCount(req.user.id);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get message by ID' })
    @ApiResponse({ status: 200, description: 'Message retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    findOne(@Param('id') id: string, @Request() req) {
        return this.messagingService.findOne(id, req.user.id);
    }

    @Patch(':id/read')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Mark message as read' })
    @ApiResponse({ status: 200, description: 'Message marked as read' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    async markAsRead(@Param('id') id: string, @Request() req) {
        const message = await this.messagingService.markAsRead(id, req.user.id);
        this.messagingGateway.notifyRead(message);
        return message;
    }

    @Patch('conversation/:userId/read')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Mark all messages in conversation as read' })
    @ApiResponse({ status: 200, description: 'Conversation marked as read' })
    async markConversationAsRead(@Param('userId') userId: string, @Request() req) {
        const result = await this.messagingService.markConversationAsRead(req.user.id, userId);
        this.messagingGateway.notifyConversationRead(req.user.id, userId);
        return result;
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Delete a message' })
    @ApiResponse({ status: 200, description: 'Message deleted successfully' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    deleteMessage(@Param('id') id: string, @Request() req) {
        return this.messagingService.deleteMessage(id, req.user.id);
    }
}
