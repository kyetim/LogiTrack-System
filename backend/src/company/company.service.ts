import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AddUserToCompanyDto } from './dto/add-user-to-company.dto';

@Injectable()
export class CompanyService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all companies with pagination
     */
    async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [companies, total] = await Promise.all([
            this.prisma.company.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    taxNumber: true,
                    address: true,
                    contactEmail: true,
                    contactPhone: true,
                    isActive: true,
                    creditLimit: true,
                    currentBalance: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            users: true,
                            invoices: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.company.count(),
        ]);

        return {
            data: companies,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get company by ID with users and statistics
     */
    async findOne(id: string) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        invoices: true,
                    },
                },
            },
        });

        if (!company) {
            throw new NotFoundException(`Company with ID ${id} not found`);
        }

        return company;
    }

    /**
     * Find company by tax number
     */
    async findByTaxNumber(taxNumber: string) {
        return this.prisma.company.findUnique({
            where: { taxNumber },
        });
    }

    /**
     * Create a new company
     */
    async create(createCompanyDto: CreateCompanyDto) {
        // Check if company with same tax number exists
        const existing = await this.findByTaxNumber(createCompanyDto.taxNumber);
        if (existing) {
            throw new ConflictException('Company with this tax number already exists');
        }

        const company = await this.prisma.company.create({
            data: {
                name: createCompanyDto.name,
                taxNumber: createCompanyDto.taxNumber,
                address: createCompanyDto.address,
                contactEmail: createCompanyDto.contactEmail,
                contactPhone: createCompanyDto.contactPhone,
                creditLimit: createCompanyDto.creditLimit || 0,
            },
            select: {
                id: true,
                name: true,
                taxNumber: true,
                address: true,
                contactEmail: true,
                contactPhone: true,
                isActive: true,
                creditLimit: true,
                currentBalance: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return company;
    }

    /**
     * Update company information
     */
    async update(id: string, updateCompanyDto: UpdateCompanyDto) {
        // Check if company exists
        await this.findOne(id);

        // If updating tax number, check uniqueness
        if (updateCompanyDto.taxNumber) {
            const existing = await this.findByTaxNumber(updateCompanyDto.taxNumber);
            if (existing && existing.id !== id) {
                throw new ConflictException('Tax number already in use by another company');
            }
        }

        const company = await this.prisma.company.update({
            where: { id },
            data: updateCompanyDto,
            select: {
                id: true,
                name: true,
                taxNumber: true,
                address: true,
                contactEmail: true,
                contactPhone: true,
                isActive: true,
                creditLimit: true,
                currentBalance: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return company;
    }

    /**
     * Soft delete company (set isActive to false)
     */
    async remove(id: string) {
        // Check if company exists
        await this.findOne(id);

        // Soft delete by setting isActive to false
        await this.prisma.company.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'Company deactivated successfully' };
    }

    /**
     * Hard delete company (permanent)
     */
    async hardDelete(id: string) {
        // Check if company exists
        await this.findOne(id);

        // Check if company has pending invoices
        const hasActiveData = await this.prisma.company.findUnique({
            where: { id },
            select: {
                invoices: {
                    where: { status: 'PENDING' },
                    take: 1,
                },
            },
        });

        if (hasActiveData?.invoices.length) {
            throw new BadRequestException(
                'Cannot delete company with pending invoices'
            );
        }

        await this.prisma.company.delete({
            where: { id },
        });

        return { message: 'Company deleted permanently' };
    }

    /**
     * Add user to company with specific role
     */
    async addUser(companyId: string, addUserDto: AddUserToCompanyDto) {
        // Check if company exists
        await this.findOne(companyId);

        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: addUserDto.userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${addUserDto.userId} not found`);
        }

        // Check if user is already in company
        const existing = await this.prisma.companyUser.findUnique({
            where: {
                userId_companyId: {
                    userId: addUserDto.userId,
                    companyId,
                },
            },
        });

        if (existing) {
            throw new ConflictException('User is already a member of this company');
        }

        // Add user to company
        const companyUser = await this.prisma.companyUser.create({
            data: {
                userId: addUserDto.userId,
                companyId,
                role: addUserDto.role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return companyUser;
    }

    /**
     * Remove user from company
     */
    async removeUser(companyId: string, userId: string) {
        // Check if association exists
        const companyUser = await this.prisma.companyUser.findUnique({
            where: {
                userId_companyId: {
                    userId,
                    companyId,
                },
            },
        });

        if (!companyUser) {
            throw new NotFoundException('User is not a member of this company');
        }

        await this.prisma.companyUser.delete({
            where: {
                userId_companyId: {
                    userId,
                    companyId,
                },
            },
        });

        return { message: 'User removed from company successfully' };
    }

    async getStatistics(id: string) {
        const company = await this.findOne(id);

        const [totalRevenue, pendingInvoices] = await Promise.all([
            this.prisma.invoice.aggregate({
                where: {
                    companyId: id,
                    status: 'PAID',
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.invoice.count({
                where: {
                    companyId: id,
                    status: 'PENDING',
                },
            }),
        ]);

        return {
            id: company.id,
            name: company.name,
            isActive: company.isActive,
            creditLimit: company.creditLimit,
            currentBalance: company.currentBalance,
            statistics: {
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                pendingInvoices,
                totalUsers: company.users.length,
            },
        };
    }
}
