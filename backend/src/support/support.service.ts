import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddInternalNoteDto } from './dto/add-internal-note.dto';
import { TicketStatus, TicketPriority, UserRole } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SupportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService
    ) { }

    /**
     * Get driver's active ticket (returns null if none exists — does NOT auto-create)
     */
    async getDriverTicket(driverId: string) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: {
                driverId,
                status: {
                    in: [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_REPLY],
                },
            },
            include: {
                messages: {
                    where: { isInternal: false },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, email: true, role: true },
                        },
                    },
                },
                assignedTo: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        return ticket; // null if no active ticket — mobile handles this gracefully
    }

    /**
     * Internal: create a new ticket for driver (called when sending first message)
     */
    private async createDriverTicket(driverId: string, priority: TicketPriority = TicketPriority.NORMAL) {
        const ticketNumber = await this.generateTicketNumber();
        return this.prisma.supportTicket.create({
            data: {
                ticketNumber,
                driverId,
                subject: 'Yeni Destek Talebi',
                status: TicketStatus.OPEN,
                priority,
            },
            include: {
                messages: {
                    include: {
                        sender: { select: { id: true, email: true, role: true } },
                    },
                },
                assignedTo: { select: { id: true, email: true, role: true } },
            },
        });
    }

    /**
     * Get driver's closed/resolved ticket history
     */
    async getDriverTicketHistory(driverId: string) {
        return this.prisma.supportTicket.findMany({
            where: {
                driverId,
                status: { in: [TicketStatus.CLOSED, TicketStatus.RESOLVED] },
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Driver sends a message to their ticket (creates ticket if none exists)
     */
    async sendDriverMessage(driverId: string, sendMessageDto: SendMessageDto) {
        // Get existing active ticket OR create one if none exists
        let ticket = await this.getDriverTicket(driverId);
        if (!ticket) {
            ticket = await this.createDriverTicket(driverId);
        }

        const message = await this.prisma.supportMessage.create({
            data: {
                ticketId: ticket.id,
                senderId: driverId,
                content: sendMessageDto.content,
                attachments: sendMessageDto.attachments || null,
            },
            include: {
                sender: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        // Update ticket status to WAITING_REPLY
        await this.prisma.supportTicket.update({
            where: { id: ticket.id },
            data: {
                status: TicketStatus.WAITING_REPLY,
                updatedAt: new Date(),
            },
        });

        return message;
    }

    /**
     * Get all tickets (Admin/Dispatcher only)
     */
    async getAllTickets(filters?: { status?: TicketStatus; assignedToMe?: boolean }, userId?: string) {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.assignedToMe && userId) {
            where.assignedToId = userId;
        }

        const tickets = await this.prisma.supportTicket.findMany({
            where,
            include: {
                driver: {
                    select: { id: true, email: true, phoneNumber: true },
                },
                assignedTo: {
                    select: { id: true, email: true, role: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Last message only for list view
                },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        });

        return tickets;
    }

    /**
     * Get specific ticket detail
     */
    async getTicket(ticketId: string, userId: string, userRole: UserRole) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                driver: {
                    select: { id: true, email: true, phoneNumber: true },
                },
                assignedTo: {
                    select: { id: true, email: true, role: true },
                },
                messages: {
                    where:
                        userRole === UserRole.DRIVER
                            ? { isInternal: false } // Drivers cannot see internal notes
                            : undefined, // Admins see everything
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, email: true, role: true },
                        },
                    },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        // Authorization check: drivers can only see their own tickets
        if (userRole === UserRole.DRIVER && ticket.driverId !== userId) {
            throw new ForbiddenException('You can only access your own tickets');
        }

        return ticket;
    }

    /**
     * Assign ticket to admin/dispatcher
     */
    async assignTicket(ticketId: string, adminId: string) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        // Update ticket
        const updatedTicket = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                assignedToId: adminId,
                assignedAt: new Date(),
                status: TicketStatus.ASSIGNED,
            },
            include: {
                assignedTo: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        // Create system message
        await this.addSystemMessage(ticketId, `${updatedTicket.assignedTo?.email} konuşmayı üstlendi`);

        return updatedTicket;
    }

    /**
     * Admin/Dispatcher sends reply
     */
    async sendAdminReply(ticketId: string, adminId: string, sendMessageDto: SendMessageDto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        // Auto-assign if not assigned
        if (!ticket.assignedToId) {
            await this.assignTicket(ticketId, adminId);
        }

        const isFirstResponse = !ticket.firstResponseAt;

        const message = await this.prisma.supportMessage.create({
            data: {
                ticketId,
                senderId: adminId,
                content: sendMessageDto.content,
                attachments: sendMessageDto.attachments || null,
            },
            include: {
                sender: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        // Update ticket
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: TicketStatus.IN_PROGRESS,
                firstResponseAt: isFirstResponse ? new Date() : ticket.firstResponseAt,
                responseCount: { increment: 1 },
                updatedAt: new Date(),
            },
        });

        // Trigger push notification to the driver
        if (ticket.driverId) {
            await this.notificationService.sendPushNotification(
                ticket.driverId,
                'Destek Mesajı',
                'Destek talebinize yeni bir cevap geldi.',
                { type: 'support_message', ticketId }
            );
        }

        return message;
    }

    /**
     * Add internal note (Admin/Dispatcher only, driver will not see)
     */
    async addInternalNote(ticketId: string, adminId: string, noteDto: AddInternalNoteDto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        const note = await this.prisma.supportMessage.create({
            data: {
                ticketId,
                senderId: adminId,
                content: noteDto.content,
                isInternal: true,
            },
            include: {
                sender: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        return note;
    }

    /**
     * Update ticket status
     */
    async updateTicketStatus(ticketId: string, updateStatusDto: UpdateTicketStatusDto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        const updateData: any = {
            status: updateStatusDto.status,
            updatedAt: new Date(),
        };

        if (updateStatusDto.status === TicketStatus.RESOLVED) {
            updateData.resolvedAt = new Date();
        }

        if (updateStatusDto.status === TicketStatus.CLOSED) {
            updateData.closedAt = new Date();
        }

        const updatedTicket = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: updateData,
        });

        // Add system message if note provided
        if (updateStatusDto.note) {
            await this.addSystemMessage(ticketId, updateStatusDto.note);
        }

        // Trigger push notification to the driver
        if (ticket.driverId && updateData.status) {
            const statusLabels: Record<string, string> = {
                OPEN: 'Açık',
                ASSIGNED: 'Atandı',
                WAITING_REPLY: 'Cevap Bekleniyor',
                IN_PROGRESS: 'Devam Ediyor',
                RESOLVED: 'Çözüldü',
                CLOSED: 'Kapalı'
            };
            await this.notificationService.sendPushNotification(
                ticket.driverId,
                'Destek Talebi Güncellendi',
                `Destek talebinizin durumu "${statusLabels[updateData.status]}" olarak değiştirildi.`,
                { type: 'support_status_update', ticketId }
            );
        }

        return updatedTicket;
    }

    /**
     * Close driver's ticket (Driver action)
     */
    async closeDriverTicket(driverId: string) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: {
                driverId,
                status: {
                    not: TicketStatus.CLOSED,
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('No active ticket found');
        }

        const closed = await this.prisma.supportTicket.update({
            where: { id: ticket.id },
            data: {
                status: TicketStatus.CLOSED,
                closedAt: new Date(),
            },
        });

        return closed;
    }

    /**
     * Create URGENT emergency ticket (accident, critical issues)
     * Returns ticket + emergency contact phone number
     */
    async createEmergencyTicket(driverId: string, location?: string) {
        const ticketNumber = await this.generateTicketNumber();

        // Create URGENT ticket
        const ticket = await this.prisma.supportTicket.create({
            data: {
                ticketNumber,
                driverId,
                subject: '🚨 ACİL DURUM',
                status: TicketStatus.OPEN,
                priority: TicketPriority.URGENT,
            },
            include: {
                driver: {
                    select: { id: true, email: true, phoneNumber: true },
                },
            },
        });

        // Add system message with location if provided
        const emergencyMessage = location
            ? `ACİL DURUM! Sürücü konumu: ${location}`
            : 'ACİL DURUM! Sürücü acil yardım talep etti.';

        await this.addSystemMessage(ticket.id, emergencyMessage);

        // TODO: Send WebSocket notification to all admins
        // TODO: Send push notification

        // Return ticket + emergency contact
        return {
            ticket,
            emergencyContact: {
                phone: '0555 123 45 67',
                name: 'LogiTrack Acil Destek',
                available247: true,
            },
        };
    }

    /**
     * Get support statistics (for dashboard)
     */
    async getStats() {
        const [openCount, assignedCount, resolvedToday, avgResponseTime] = await Promise.all([
            this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
            this.prisma.supportTicket.count({
                where: { status: { in: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS] } },
            }),
            this.prisma.supportTicket.count({
                where: {
                    status: TicketStatus.RESOLVED,
                    resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            this.calculateAverageResponseTime(),
        ]);

        return {
            openCount,
            assignedCount,
            resolvedToday,
            avgResponseTimeMinutes: avgResponseTime,
        };
    }

    // =========== PRIVATE HELPERS ===========

    private async generateTicketNumber(): Promise<string> {
        const count = await this.prisma.supportTicket.count();
        return `TKT-${String(count + 1).padStart(6, '0')}`;
    }

    private async addSystemMessage(ticketId: string, content: string) {
        return await this.prisma.supportMessage.create({
            data: {
                ticketId,
                senderId: (await this.prisma.user.findFirst({ where: { role: UserRole.ADMIN } }))?.id || '',
                content,
                isSystemMessage: true,
            },
        });
    }

    private async calculateAverageResponseTime(): Promise<number> {
        const tickets = await this.prisma.supportTicket.findMany({
            where: {
                firstResponseAt: { not: null },
            },
            select: {
                createdAt: true,
                firstResponseAt: true,
            },
        });

        if (tickets.length === 0) return 0;

        const totalMinutes = tickets.reduce((sum, ticket) => {
            const diff = ticket.firstResponseAt!.getTime() - ticket.createdAt.getTime();
            return sum + diff / (1000 * 60); // Convert to minutes
        }, 0);

        return Math.round(totalMinutes / tickets.length);
    }
}
