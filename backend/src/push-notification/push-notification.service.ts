import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto, RegisterDeviceDto, BroadcastNotificationDto, NotificationType } from './dto/notification.dto';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
    private logger = new Logger('PushNotificationService');
    private expo: Expo;

    constructor(private prisma: PrismaService) {
        this.expo = new Expo();
    }

    /**
     * Register device token for a user
     */
    async registerDevice(userId: string, registerDeviceDto: RegisterDeviceDto) {
        // Check if token already exists
        const existing = await this.prisma.$queryRaw`
      SELECT * FROM user_device_tokens 
      WHERE user_id = ${userId} AND device_token = ${registerDeviceDto.deviceToken}
    `;

        if (Array.isArray(existing) && existing.length > 0) {
            return { message: 'Device token already registered' };
        }

        // Store token in database
        await this.prisma.$executeRaw`
      INSERT INTO user_device_tokens (user_id, device_token, platform, created_at)
      VALUES (${userId}, ${registerDeviceDto.deviceToken}, ${registerDeviceDto.platform || 'unknown'}, NOW())
    `;

        this.logger.log(`Device token registered for user ${userId}`);

        return { message: 'Device token registered successfully' };
    }

    /**
     * Remove device token (logout)
     */
    async removeDevice(userId: string, deviceToken: string) {
        await this.prisma.$executeRaw`
      DELETE FROM user_device_tokens 
      WHERE user_id = ${userId} AND device_token = ${deviceToken}
    `;

        this.logger.log(`Device token removed for user ${userId}`);

        return { message: 'Device token removed successfully' };
    }

    /**
     * Send notification to a specific user
     */
    async sendToUser(sendNotificationDto: SendNotificationDto) {
        // Get user's device tokens
        const tokens = await this.prisma.$queryRaw<Array<{ device_token: string }>>`
      SELECT device_token FROM user_device_tokens 
      WHERE user_id = ${sendNotificationDto.userId}
    `;

        if (!tokens || tokens.length === 0) {
            this.logger.warn(`No device tokens found for user ${sendNotificationDto.userId}`);
            return { success: false, message: 'No device tokens found' };
        }

        const deviceTokens = tokens.map((t) => t.device_token);

        // Send via Firebase (mock implementation)
        const result = await this.sendFirebaseNotification(
            deviceTokens,
            sendNotificationDto.title,
            sendNotificationDto.body,
            sendNotificationDto.data
        );

        // Save notification to database for history
        await this.saveNotificationHistory(
            sendNotificationDto.userId,
            sendNotificationDto.title,
            sendNotificationDto.body,
            sendNotificationDto.type || 'INFO'
        );

        return result;
    }

    /**
     * Broadcast notification to multiple users
     */
    async broadcast(broadcastNotificationDto: BroadcastNotificationDto) {
        let query = 'SELECT DISTINCT device_token FROM user_device_tokens';

        // Filter by roles if specified
        if (broadcastNotificationDto.targetRoles && broadcastNotificationDto.targetRoles.length > 0) {
            query += ` WHERE user_id IN (
        SELECT id FROM users WHERE role IN (${broadcastNotificationDto.targetRoles.map(r => `'${r}'`).join(',')})
      )`;
        }

        const tokens = await this.prisma.$queryRawUnsafe<Array<{ device_token: string }>>(query);

        if (!tokens || tokens.length === 0) {
            this.logger.warn('No device tokens found for broadcast');
            return { success: false, message: 'No device tokens found' };
        }

        const deviceTokens = tokens.map((t) => t.device_token);

        const result = await this.sendFirebaseNotification(
            deviceTokens,
            broadcastNotificationDto.title,
            broadcastNotificationDto.body,
            null
        );

        this.logger.log(`Broadcast sent to ${deviceTokens.length} devices`);

        return { ...result, recipientCount: deviceTokens.length };
    }

    /**
     * Send push notification via Expo Push Notification Service
     */
    private async sendFirebaseNotification(
        tokens: string[],
        title: string,
        body: string,
        data?: any
    ) {
        const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));

        if (validTokens.length === 0) {
            this.logger.warn(`No valid Expo push tokens among ${tokens.length} provided`);
            return { success: false, successCount: 0, failureCount: tokens.length };
        }

        const messages: ExpoPushMessage[] = validTokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data: data || {},
        }));

        let successCount = 0;
        let failureCount = 0;

        try {
            const chunks = this.expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                const tickets = await this.expo.sendPushNotificationsAsync(chunk);
                for (const ticket of tickets) {
                    if (ticket.status === 'ok') {
                        successCount++;
                    } else {
                        failureCount++;
                        this.logger.warn(`Push notification failed: ${ticket.message}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error('Expo push notification error', error);
            return { success: false, successCount, failureCount: tokens.length };
        }

        this.logger.log(`Push notifications sent: ${successCount} success, ${failureCount} failed`);
        return { success: true, successCount, failureCount };
    }

    /**
     * Save notification to database for history
     */
    private async saveNotificationHistory(
        userId: string,
        title: string,
        body: string,
        type: string
    ) {
        try {
            await this.prisma.$executeRaw`
        INSERT INTO notification_history (user_id, title, body, type, sent_at)
        VALUES (${userId}, ${title}, ${body}, ${type}, NOW())
      `;
        } catch (error) {
            this.logger.error('Failed to save notification history', error);
        }
    }

    /**
     * Get notification history for a user
     */
    async getUserNotifications(userId: string, limit: number = 50) {
        const notifications = await this.prisma.$queryRaw`
      SELECT * FROM notification_history 
      WHERE user_id = ${userId}
      ORDER BY sent_at DESC
      LIMIT ${limit}
    `;

        return notifications;
    }

    /**
     * Send notification when new message arrives
     */
    async notifyNewMessage(recipientId: string, senderEmail: string, messagePreview: string) {
        return this.sendToUser({
            userId: recipientId,
            title: `New message from ${senderEmail}`,
            body: messagePreview,
            type: NotificationType.INFO,
            data: {
                type: 'new_message',
                senderId: senderEmail,
            },
        });
    }

    /**
     * Send notification for document expiry
     */
    async notifyDocumentExpiry(userId: string, documentName: string, daysRemaining: number) {
        return this.sendToUser({
            userId,
            title: 'Document Expiring Soon',
            body: `Your ${documentName} will expire in ${daysRemaining} days`,
            type: NotificationType.WARNING,
            data: {
                type: 'document_expiry',
                documentName,
                daysRemaining,
            },
        });
    }

    /**
     * Send notification for shipment status change
     */
    async notifyShipmentStatus(driverId: string, trackingNumber: string, newStatus: string) {
        return this.sendToUser({
            userId: driverId,
            title: 'Shipment Status Updated',
            body: `Shipment ${trackingNumber} is now ${newStatus}`,
            type: NotificationType.INFO,
            data: {
                type: 'shipment_status',
                trackingNumber,
                status: newStatus,
            },
        });
    }
}
