import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/messaging',
})
export class MessagingGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('MessagingGateway');
    private userSockets = new Map<string, string>(); // userId -> socketId

    constructor(private messagingService: MessagingService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);

        // Get userId from handshake query
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.userSockets.set(userId, client.id);
            client['userId'] = userId;
            this.logger.log(`User ${userId} connected with socket ${client.id}`);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client['userId'];
        if (userId) {
            this.userSockets.delete(userId);
            this.logger.log(`User ${userId} disconnected`);
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * Send a new message via WebSocket
     */
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { recipientId: string; content: string; attachments?: any },
    ) {
        try {
            const senderId = client['userId'];

            if (!senderId) {
                return { error: 'Unauthorized' };
            }

            // Save message to database
            const message = await this.messagingService.sendMessage(senderId, {
                recipientId: data.recipientId,
                content: data.content,
                attachments: data.attachments,
            });

            // Send to recipient if online
            const recipientSocketId = this.userSockets.get(data.recipientId);
            if (recipientSocketId) {
                this.server.to(recipientSocketId).emit('newMessage', message);
            }

            // Confirm to sender
            return { success: true, message };
        } catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            return { error: error.message };
        }
    }

    /**
     * Mark message as read
     */
    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string },
    ) {
        try {
            const userId = client['userId'];

            if (!userId) {
                return { error: 'Unauthorized' };
            }

            const message = await this.messagingService.markAsRead(data.messageId, userId);

            // Notify sender
            const senderSocketId = this.userSockets.get(message.senderId);
            if (senderSocketId) {
                this.server.to(senderSocketId).emit('messageRead', {
                    messageId: message.id,
                    readAt: message.readAt,
                });
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`Error marking message as read: ${error.message}`);
            return { error: error.message };
        }
    }

    /**
     * Typing indicator
     */
    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { recipientId: string },
    ) {
        const userId = client['userId'];
        const recipientSocketId = this.userSockets.get(data.recipientId);

        if (recipientSocketId) {
            this.server.to(recipientSocketId).emit('userTyping', { userId });
        }
    }

    /**
     * Stop typing indicator
     */
    @SubscribeMessage('stopTyping')
    handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { recipientId: string },
    ) {
        const userId = client['userId'];
        const recipientSocketId = this.userSockets.get(data.recipientId);

        if (recipientSocketId) {
            this.server.to(recipientSocketId).emit('userStoppedTyping', { userId });
        }
    }

    handleGetOnlineStatus(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userIds: string[] },
    ) {
        const onlineUsers = data.userIds.filter((userId) =>
            this.userSockets.has(userId)
        );

        return { onlineUsers };
    }

    /**
     * Notify recipient of new message (called from Controller)
     */
    notifyRecipient(message: any) {
        const recipientSocketId = this.userSockets.get(message.recipientId);
        if (recipientSocketId) {
            this.server.to(recipientSocketId).emit('newMessage', message);
        }
    }

    /**
     * Notify sender that message was read (called from Controller)
     */
    notifyRead(message: any) {
        const senderSocketId = this.userSockets.get(message.senderId);
        if (senderSocketId) {
            this.server.to(senderSocketId).emit('messageRead', {
                messageId: message.id,
                readAt: message.readAt,
            });
        }
    }
}
