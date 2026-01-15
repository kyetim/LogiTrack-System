import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    findAll(@Query('page') page: string, @Query('limit') limit: string) {
        return this.userService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
        );
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async findOne(@Param('id') id: string, @Request() req) {
        const user = await this.userService.findOne(id);

        // Drivers can only see their own profile
        if (req.user.role === UserRole.DRIVER && req.user.id !== id) {
            throw new ForbiddenException('You can only access your own profile');
        }

        return user;
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.DRIVER)
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @Request() req,
    ) {
        // Drivers can only update their own profile
        if (req.user.role === UserRole.DRIVER && req.user.id !== id) {
            throw new ForbiddenException('You can only update your own profile');
        }

        // Drivers cannot change their role
        if (req.user.role === UserRole.DRIVER && updateUserDto.role) {
            throw new ForbiddenException('You cannot change your role');
        }

        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.userService.remove(id);
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMIN)
    updateRole(@Param('id') id: string, @Body('role') role: UserRole) {
        return this.userService.updateRole(id, role);
    }
}
