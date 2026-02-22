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
    private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

    constructor(private messagingService: MessagingService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);

        // Get userId from handshake query
        const userId = client.handshake.query.userId as string;

        if (!userId) {
            this.logger.warn(`Client ${client.id} connected without userId`);
        }

        if (userId) {
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(client.id);
            client['userId'] = userId;
            this.logger.log(`User ${userId} connected with socket ${client.id}`);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client['userId'];
        if (userId) {
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                    this.logger.log(`User ${userId} disconnected (all sockets closed)`);
                }
            }
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
            this.emitToUser(data.recipientId, 'newMessage', message);

            // Confirm to sender (optional, usually handled by return or Ack)
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

            // Notify sender that their message was read
            this.emitToUser(message.senderId, 'messageRead', {
                messageId: message.id,
                readAt: message.readAt,
            });

            // Also notify the reader (myself) on other devices/tabs
            this.emitToUser(userId, 'messageReadByMe', {
                messageId: message.id,
                readAt: message.readAt
            });

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
        this.emitToUser(data.recipientId, 'userTyping', { userId });
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
        this.emitToUser(data.recipientId, 'userStoppedTyping', { userId });
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
        this.emitToUser(message.recipientId, 'newMessage', message);
    }

    /**
     * Notify sender that message was read (called from Controller)
     */
    notifyRead(message: any) {
        // Notify sender
        this.emitToUser(message.senderId, 'messageRead', {
            messageId: message.id,
            readAt: message.readAt,
        });

        // Notify recipient (myself) to update other devices/tabs/header
        this.emitToUser(message.recipientId, 'messageReadByMe', {
            messageId: message.id,
            readAt: message.readAt
        });
    }

    /**
     * Notify that a conversation was read (called from Controller)
     */
    notifyConversationRead(userId: string, otherUserId: string) {
        // Notify myself to update counts
        this.emitToUser(userId, 'messageReadByMe', {
            conversationId: otherUserId
        });

        // Optionally notify the other user that I read their messages?
        // This is harder without individual message IDs, but we can skip for now or send a generic event.
        // For header sync, updating myself is what matters.
    }

    /**
     * Helper to emit event to all sockets of a user
     */
    private emitToUser(userId: string, event: string, data: any) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.forEach(socketId => {
                this.server.to(socketId).emit(event, data);
            });
        }
    }
}
