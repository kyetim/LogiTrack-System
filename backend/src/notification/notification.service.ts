import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
    private expo: Expo;
    private readonly logger = new Logger(NotificationService.name);

    constructor(private prisma: PrismaService) {
        this.expo = new Expo();
    }

    async saveToken(userId: string, token: string) {
        if (!Expo.isExpoPushToken(token)) {
            this.logger.error(`Push token ${token} is not a valid Expo push token`);
            return { success: false, error: 'Invalid token' };
        }

        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { pushToken: token },
            });

            this.logger.log(`Saved push token for user ${userId}`);
            return { success: true };
        } catch (error) {
            this.logger.error(`Error saving push token for user ${userId}`, error);
            return { success: false, error: 'Failed to save token' };
        }
    }

    async sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { pushToken: true },
            });

            if (!user || !user.pushToken) {
                this.logger.warn(`User ${userId} has no push token registered.`);
                return;
            }

            if (!Expo.isExpoPushToken(user.pushToken)) {
                this.logger.error(`Push token ${user.pushToken} is not a valid Expo push token`);
                return;
            }

            const messages: ExpoPushMessage[] = [{
                to: user.pushToken,
                sound: 'default',
                title,
                body,
                data,
            }];

            const chunks = this.expo.chunkPushNotifications(messages);

            for (const chunk of chunks) {
                try {
                    const tickets = await this.expo.sendPushNotificationsAsync(chunk);
                    this.logger.log(`Notification sent to user ${userId}, tickets: ${JSON.stringify(tickets)}`);
                } catch (error) {
                    this.logger.error('Error sending chunks', error);
                }
            }
        } catch (error) {
            this.logger.error('Error sending push notification', error);
        }
    }
}
