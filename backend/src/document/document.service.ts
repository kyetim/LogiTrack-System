import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { EntityType } from '@prisma/client';

@Injectable()
export class DocumentService {
    constructor(private prisma: PrismaService) { }

    // ... existing code ...

    /**
     * Get documents for a specific entity
     */
    async getEntityDocuments(entityType: string, entityId: string) {
        console.log(`📂 getEntityDocuments called with type=${entityType} id=${entityId}`);
        try {
            // Ensure strict Enum matching
            const typeEnum = EntityType[entityType as keyof typeof EntityType];

            if (!typeEnum) {
                throw new Error(`Invalid entity type: ${entityType}`);
            }

            const documents = await this.prisma.document.findMany({
                where: {
                    entityType: typeEnum,
                    entityId,
                },
                orderBy: { uploadedAt: 'desc' },
            });
            return documents;
        } catch (error) {
            console.error('❌ Error in getEntityDocuments prisma call:', error);
            throw error;
        }
    }

    /**
     * Upload a new document
     */
    async uploadDocument(uploadDocumentDto: UploadDocumentDto) {
        const document = await this.prisma.document.create({
            data: {
                entityType: uploadDocumentDto.entityType,
                entityId: uploadDocumentDto.entityId,
                type: uploadDocumentDto.type,
                fileName: uploadDocumentDto.fileName,
                displayName: uploadDocumentDto.displayName,
                fileUrl: uploadDocumentDto.fileUrl,
                fileSize: uploadDocumentDto.fileSize,
                mimeType: uploadDocumentDto.mimeType,
                extractedData: uploadDocumentDto.extractedData as any,
                expiryDate: uploadDocumentDto.expiryDate
                    ? new Date(uploadDocumentDto.expiryDate)
                    : null,
                uploadLocation: uploadDocumentDto.uploadLocation as any,
            },
        });

        return document;
    }

    /**
     * Get all documents with filtering
     */
    async findAll(filters?: FilterDocumentDto) {
        const where: any = {};

        if (filters?.entityType) {
            where.entityType = filters.entityType;
        }

        if (filters?.entityId) {
            where.entityId = filters.entityId;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.isVerified !== undefined) {
            where.isVerified = filters.isVerified;
        }

        if (filters?.expiringSoon) {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            where.expiryDate = {
                lte: thirtyDaysFromNow,
                gte: new Date(),
            };
        }

        const documents = await this.prisma.document.findMany({
            where,
            orderBy: { uploadedAt: 'desc' },
        });

        return documents;
    }

    /**
     * Get document by ID
     */
    async findOne(id: string) {
        const document = await this.prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            throw new NotFoundException(`Document with ID ${id} not found`);
        }

        return document;
    }

    /**
     * Delete a document
     */
    async remove(id: string, user?: any) {
        const document = await this.findOne(id);

        // If driver, verify ownership
        if (user && user.role === 'DRIVER') {
            const driver = await this.prisma.driverProfile.findUnique({
                where: { userId: user.id },
            });

            if (!driver) {
                throw new ForbiddenException('Driver profile not found');
            }

            // Check if document belongs to this driver
            if (document.entityType !== 'DRIVER' || document.entityId !== driver.id) {
                throw new ForbiddenException('You can only delete your own documents');
            }
        }

        await this.prisma.document.delete({
            where: { id },
        });

        // TODO: Also delete the file from storage (S3, etc.)

        return { message: 'Document deleted successfully' };
    }

    /**
     * Verify a document (admin only)
     */
    async verifyDocument(id: string, verifiedBy: string) {
        await this.findOne(id);

        const document = await this.prisma.document.update({
            where: { id },
            data: {
                isVerified: true,
                verifiedBy,
                verifiedAt: new Date(),
            },
        });

        return document;
    }

    /**
     * Get expiring documents (within specified days)
     */
    async getExpiringDocuments(daysAhead: number = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const documents = await this.prisma.document.findMany({
            where: {
                expiryDate: {
                    lte: futureDate,
                    gte: new Date(),
                },
            },
            orderBy: { expiryDate: 'asc' },
        });

        return documents;
    }



    /**
     * Get document statistics
     */
    async getStatistics() {
        const [total, verified, unverified, expiring, expired] = await Promise.all([
            this.prisma.document.count(),
            this.prisma.document.count({ where: { isVerified: true } }),
            this.prisma.document.count({ where: { isVerified: false } }),
            this.prisma.document.count({
                where: {
                    expiryDate: {
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        gte: new Date(),
                    },
                },
            }),
            this.prisma.document.count({
                where: {
                    expiryDate: {
                        lt: new Date(),
                    },
                },
            }),
        ]);

        return {
            total,
            verified,
            unverified,
            expiring: expiring,
            expired,
        };
    }

    /**
     * Update document expiry date
     */
    async updateExpiryDate(id: string, expiryDate: string) {
        await this.findOne(id);

        const document = await this.prisma.document.update({
            where: { id },
            data: {
                expiryDate: new Date(expiryDate),
            },
        });

        return document;
    }

    /**
     * Get my documents (Driver)
     */
    async findMyDocuments(userId: string) {
        // Find driver profile for this user
        const driver = await this.prisma.driverProfile.findUnique({
            where: { userId },
        });

        if (!driver) {
            throw new NotFoundException('Driver profile not found');
        }

        // Get documents for this driver
        return this.getEntityDocuments('DRIVER', driver.id);
    }
}

