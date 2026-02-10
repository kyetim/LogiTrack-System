import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
}

export class SendNotificationDto {
    @ApiProperty({ example: 'user-uuid', description: 'User ID to send notification to' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ example: 'New Message', description: 'Notification title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'You have a new message from dispatcher', description: 'Notification body' })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.INFO })
    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;

    @ApiPropertyOptional({ description: 'Additional data as JSON' })
    @IsOptional()
    data?: any;
}

export class RegisterDeviceDto {
    @ApiProperty({ example: 'fcm-token-here', description: 'FCM device token' })
    @IsString()
    @IsNotEmpty()
    deviceToken: string;

    @ApiPropertyOptional({ example: 'iOS', description: 'Device platform' })
    @IsString()
    @IsOptional()
    platform?: string;
}

export class BroadcastNotificationDto {
    @ApiProperty({ example: 'System Maintenance', description: 'Notification title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'System will be down for maintenance', description: 'Notification body' })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiPropertyOptional({ description: 'Target user roles', type: [String] })
    @IsArray()
    @IsOptional()
    targetRoles?: string[];

    @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.INFO })
    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;
}
