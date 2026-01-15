import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    driverProfile: {
                        select: {
                            id: true,
                            licenseNumber: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count(),
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                driverProfile: {
                    select: {
                        id: true,
                        licenseNumber: true,
                        vehicleId: true,
                        isActive: true,
                        status: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(createUserDto: CreateUserDto) {
        const { email, password, role } = createUserDto;

        // Check if user exists
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                role,
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        // Check if user exists
        await this.findOne(id);

        const updateData: any = {};

        if (updateUserDto.email) {
            // Check if email is already taken by another user
            const existingUser = await this.findByEmail(updateUserDto.email);
            if (existingUser && existingUser.id !== id) {
                throw new ConflictException('Email already in use');
            }
            updateData.email = updateUserDto.email;
        }

        if (updateUserDto.password) {
            updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
        }

        if (updateUserDto.role) {
            updateData.role = updateUserDto.role;
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async remove(id: string) {
        // Check if user exists
        await this.findOne(id);

        await this.prisma.user.delete({
            where: { id },
        });

        return { message: 'User deleted successfully' };
    }

    async updateRole(id: string, role: UserRole) {
        await this.findOne(id);

        const user = await this.prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }
}
