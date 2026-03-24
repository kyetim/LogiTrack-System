import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
    constructor(private prisma: PrismaService) { }

    /**
     * Send a new message
     */
    async sendMessage(senderId: string, sendMessageDto: SendMessageDto) {
        // Verify recipient exists
        const recipient = await this.prisma.user.findUnique({
            where: { id: sendMessageDto.recipientId },
        });

        if (!recipient) {
            throw new NotFoundException('Recipient not found');
        }

        const message = await this.prisma.message.create({
            data: {
                senderId,
                recipientId: sendMessageDto.recipientId,
                content: sendMessageDto.content,
                attachments: sendMessageDto.attachments as any,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return message;
    }

    /**
     * Get user's inbox (received messages)
     */
    async getInbox(userId: string, page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { recipientId: userId },
                skip,
                take: limit,
                include: {
                    sender: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.message.count({ where: { recipientId: userId } }),
        ]);

        return {
            data: messages,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                unreadCount: await this.getUnreadCount(userId),
            },
        };
    }

    /**
     * Get user's sent messages
     */
    async getSentMessages(userId: string, page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { senderId: userId },
                skip,
                take: limit,
                include: {
                    recipient: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.message.count({ where: { senderId: userId } }),
        ]);

        return {
            data: messages,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get conversation between two users
     */
    async getConversation(userId: string, otherUserId: string) {
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: otherUserId },
                    { senderId: otherUserId, recipientId: userId },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: 100, // Last 100 messages
        });

        // Mark messages as read
        await this.markConversationAsRead(userId, otherUserId);

        return messages;
    }

    /**
     * Mark a message as read
     */
    async markAsRead(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Only recipient can mark as read
        if (message.recipientId !== userId) {
            throw new NotFoundException('Message not found');
        }

        const updatedMessage = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return updatedMessage;
    }

    /**
     * Mark all messages in a conversation as read
     */
    async markConversationAsRead(userId: string, otherUserId: string) {
        await this.prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                recipientId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { message: 'Conversation marked as read' };
    }

    /**
     * Get unread message count for user
     */
    async getUnreadCount(userId: string) {
        return this.prisma.message.count({
            where: {
                recipientId: userId,
                isRead: false,
            },
        });
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Only sender can delete
        if (message.senderId !== userId) {
            throw new NotFoundException('Message not found');
        }

        await this.prisma.message.delete({
            where: { id: messageId },
        });

        return { message: 'Message deleted successfully' };
    }

    /**
     * Get message by ID
     */
    async findOne(id: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Check access
        if (message.senderId !== userId && message.recipientId !== userId) {
            throw new NotFoundException('Message not found');
        }

        return message;
    }

    /**
     * Get all conversations for a user (list of users they've chatted with)
     */
    async getConversationsList(userId: string) {
        // Get all unique users this user has chatted with
        const sentTo = await this.prisma.message.findMany({
            where: { senderId: userId },
            select: { recipientId: true },
            distinct: ['recipientId'],
        });

        const receivedFrom = await this.prisma.message.findMany({
            where: { recipientId: userId },
            select: { senderId: true },
            distinct: ['senderId'],
        });

        // Combine and deduplicate
        const userIds = [
            ...new Set([
                ...sentTo.map((m) => m.recipientId),
                ...receivedFrom.map((m) => m.senderId),
            ]),
        ];

        // Get user details with last message and unread count
        const conversations = await Promise.all(
            userIds.map(async (otherUserId) => {
                const [lastMessage, unreadCount, user] = await Promise.all([
                    this.prisma.message.findFirst({
                        where: {
                            OR: [
                                { senderId: userId, recipientId: otherUserId },
                                { senderId: otherUserId, recipientId: userId },
                            ],
                        },
                        orderBy: { createdAt: 'desc' },
                    }),
                    this.prisma.message.count({
                        where: {
                            senderId: otherUserId,
                            recipientId: userId,
                            isRead: false,
                        },
                    }),
                    this.prisma.user.findUnique({
                        where: { id: otherUserId },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    }),
                ]);

                return {
                    user,
                    lastMessage,
                    unreadCount,
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt?.getTime() || 0;
            const timeB = b.lastMessage?.createdAt?.getTime() || 0;
            return timeB - timeA;
        });

        return conversations;
    }
}
