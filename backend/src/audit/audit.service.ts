import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditLog } from '@prisma/client';

export interface CreateAuditLogDto {
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
}

@Injectable()
export class AuditService {
    constructor(private readonly prisma: PrismaService) { }

    async createLog(data: CreateAuditLogDto): Promise<AuditLog> {
        return this.prisma.auditLog.create({
            data: {
                ...data,
                oldValues: data.oldValues ? data.oldValues : undefined,
                newValues: data.newValues ? data.newValues : undefined,
            },
        });
    }

    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        }
                    }
                }
            }),
            this.prisma.auditLog.count()
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
