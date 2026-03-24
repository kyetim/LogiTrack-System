import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post('token')
    @ApiOperation({ summary: 'Expo Push Token\'unu sunucuya kaydet' })
    @ApiBody({ schema: { type: 'object', properties: { token: { type: 'string', example: 'ExponentPushToken[xxxx]' } } } })
    @ApiResponse({ status: 200, description: 'Token başarıyla kaydedildi.' })
    @ApiResponse({ status: 400, description: 'Geçersiz Push Token.' })
    async registerToken(@CurrentUser() user: any, @Body() body: { token: string }) {
        return this.notificationService.saveToken(user.id, body.token);
    }
}
