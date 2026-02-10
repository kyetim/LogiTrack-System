import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class BillingService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new invoice
     */
    async create(createInvoiceDto: CreateInvoiceDto) {
        // Check if invoice number already exists
        const existing = await this.prisma.invoice.findUnique({
            where: { invoiceNumber: createInvoiceDto.invoiceNumber },
        });

        if (existing) {
            throw new ConflictException('Invoice number already exists');
        }

        // Verify company exists
        const company = await this.prisma.company.findUnique({
            where: { id: createInvoiceDto.companyId },
        });

        if (!company) {
            throw new NotFoundException('Company not found');
        }

        // Verify shipment if provided
        if (createInvoiceDto.shipmentId) {
            const shipment = await this.prisma.shipment.findUnique({
                where: { id: createInvoiceDto.shipmentId },
            });

            if (!shipment) {
                throw new NotFoundException('Shipment not found');
            }
        }

        const invoice = await this.prisma.invoice.create({
            data: {
                invoiceNumber: createInvoiceDto.invoiceNumber,
                companyId: createInvoiceDto.companyId,
                shipmentId: createInvoiceDto.shipmentId,
                amount: createInvoiceDto.amount,
                taxAmount: createInvoiceDto.taxAmount,
                totalAmount: createInvoiceDto.totalAmount,
                dueDate: new Date(createInvoiceDto.dueDate),
                fileUrl: createInvoiceDto.fileUrl,
                status: InvoiceStatus.PENDING,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        taxNumber: true,
                    },
                },
                shipment: {
                    select: {
                        id: true,
                        trackingNumber: true,
                    },
                },
            },
        });

        return invoice;
    }

    /**
     * Get all invoices with filtering
     */
    async findAll(filters?: {
        companyId?: string;
        status?: InvoiceStatus;
        overdue?: boolean;
    }) {
        const where: any = {};

        if (filters?.companyId) {
            where.companyId = filters.companyId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.overdue) {
            where.status = InvoiceStatus.PENDING;
            where.dueDate = {
                lt: new Date(),
            };
        }

        const invoices = await this.prisma.invoice.findMany({
            where,
            include: {
                company: {
                    select: {
                        name: true,
                        taxNumber: true,
                    },
                },
                shipment: {
                    select: {
                        trackingNumber: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return invoices;
    }

    /**
     * Get invoice by ID
     */
    async findOne(id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                company: true,
                shipment: true,
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        return invoice;
    }

    /**
     * Mark invoice as paid
     */
    async markAsPaid(id: string) {
        const invoice = await this.findOne(id);

        if (invoice.status === InvoiceStatus.PAID) {
            throw new ConflictException('Invoice is already paid');
        }

        const updatedInvoice = await this.prisma.invoice.update({
            where: { id },
            data: {
                status: InvoiceStatus.PAID,
                paidAt: new Date(),
            },
            include: {
                company: true,
            },
        });

        return updatedInvoice;
    }

    /**
     * Mark invoice as cancelled
     */
    async cancel(id: string) {
        const invoice = await this.findOne(id);

        if (invoice.status === InvoiceStatus.PAID) {
            throw new ConflictException('Cannot cancel a paid invoice');
        }

        const updatedInvoice = await this.prisma.invoice.update({
            where: { id },
            data: {
                status: InvoiceStatus.CANCELLED,
            },
        });

        return updatedInvoice;
    }

    /**
     * Get overdue invoices
     */
    async getOverdueInvoices() {
        const invoices = await this.prisma.invoice.findMany({
            where: {
                status: InvoiceStatus.PENDING,
                dueDate: {
                    lt: new Date(),
                },
            },
            include: {
                company: {
                    select: {
                        name: true,
                        contactEmail: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });

        // Update status to OVERDUE
        const invoiceIds = invoices.map((inv) => inv.id);
        if (invoiceIds.length > 0) {
            await this.prisma.invoice.updateMany({
                where: {
                    id: { in: invoiceIds },
                },
                data: {
                    status: InvoiceStatus.OVERDUE,
                },
            });
        }

        return invoices;
    }

    /**
     * Get billing statistics
     */
    async getStatistics() {
        const [
            totalInvoices,
            pendingInvoices,
            paidInvoices,
            overdueInvoices,
            totalRevenue,
            pendingAmount,
        ] = await Promise.all([
            this.prisma.invoice.count(),
            this.prisma.invoice.count({ where: { status: InvoiceStatus.PENDING } }),
            this.prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
            this.prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
            this.prisma.invoice.aggregate({
                where: { status: InvoiceStatus.PAID },
                _sum: { totalAmount: true },
            }),
            this.prisma.invoice.aggregate({
                where: { status: InvoiceStatus.PENDING },
                _sum: { totalAmount: true },
            }),
        ]);

        return {
            totalInvoices,
            pendingInvoices,
            paidInvoices,
            overdueInvoices,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            pendingAmount: pendingAmount._sum.totalAmount || 0,
        };
    }

    /**
     * Generate invoice number (auto-increment)
     */
    async generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        // Get last invoice of current month
        const lastInvoice = await this.prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    startsWith: `INV-${year}-${month}`,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastInvoice) {
            const lastSequence = parseInt(
                lastInvoice.invoiceNumber.split('-').pop() || '0'
            );
            sequence = lastSequence + 1;
        }

        return `INV-${year}-${month}-${String(sequence).padStart(4, '0')}`;
    }
}
