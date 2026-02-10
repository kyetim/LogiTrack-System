import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    UseGuards,
    Request,
    Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PushNotificationService } from './push-notification.service';
import { SendNotificationDto, RegisterDeviceDto, BroadcastNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('push-notifications')
@ApiBearerAuth()
@Controller('push-notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PushNotificationController {
    constructor(
        private readonly pushNotificationService: PushNotificationService,
    ) { }

    @Post('register-device')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Register device token for push notifications' })
    @ApiResponse({ status: 201, description: 'Device registered successfully' })
    registerDevice(@Body() registerDeviceDto: RegisterDeviceDto, @Request() req) {
        return this.pushNotificationService.registerDevice(
            req.user.id,
            registerDeviceDto,
        );
    }

    @Delete('device/:token')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Remove device token (logout)' })
    @ApiResponse({ status: 200, description: 'Device removed successfully' })
    removeDevice(@Param('token') token: string, @Request() req) {
        return this.pushNotificationService.removeDevice(req.user.id, token);
    }

    @Post('send')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Send push notification to a specific user' })
    @ApiResponse({ status: 201, description: 'Notification sent successfully' })
    sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
        return this.pushNotificationService.sendToUser(sendNotificationDto);
    }

    @Post('broadcast')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Broadcast notification to multiple users' })
    @ApiResponse({ status: 201, description: 'Broadcast sent successfully' })
    broadcast(@Body() broadcastNotificationDto: BroadcastNotificationDto) {
        return this.pushNotificationService.broadcast(broadcastNotificationDto);
    }

    @Get('history')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get notification history for current user' })
    @ApiResponse({ status: 200, description: 'Notification history retrieved' })
    getHistory(@Request() req) {
        return this.pushNotificationService.getUserNotifications(req.user.id);
    }
}
