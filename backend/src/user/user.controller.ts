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
    StreamableFile,
    Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import * as xlsx from 'xlsx';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Tüm kullanıcıları listele (sayfalanmış)' })
    @ApiResponse({ status: 200, description: 'Kullanıcı listesi döner.' })
    findAll(@Query() pagination: PaginationDto) {
        return this.userService.findAll(pagination);
    }

    @Get('export')
    @Roles(UserRole.ADMIN)
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @Header('Content-Disposition', 'attachment; filename="users.xlsx"')
    async exportUsers() {
        const users = await this.userService.findAll({ page: 1, limit: 100000 } as any);
        const exportData = users.data.map(u => ({
            ID: u.id,
            Email: u.email,
            Role: u.role,
            Created_At: u.createdAt,
            Driver_License: u.driverProfile?.licenseNumber || 'N/A',
            Driver_Status: u.driverProfile?.status || 'N/A',
        }));
        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return new StreamableFile(buffer);
    }

    @Get('admins')
    @Roles(UserRole.ADMIN, UserRole.DRIVER, UserRole.DISPATCHER)
    async getAdmins() {
        return this.userService.findAdmins();
    }

    // ============================================================
    // Admin — Şoför Onay / Red (pending-drivers BEFORE :id routes)
    // ============================================================

    @Get('pending-drivers')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin onayı bekleyen şoför başvurularını listele' })
    @ApiResponse({ status: 200, description: 'Onay bekleyen şoför listesi' })
    async getPendingDrivers() {
        return this.userService.getPendingDrivers();
    }

    @Patch(':id/approve')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Şoförü onayla — PENDING_APPROVAL → ACTIVE' })
    @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
    @ApiResponse({ status: 200, description: 'Şoför onaylandı.' })
    @ApiResponse({ status: 400, description: 'Zaten onaylanmış veya askıya alınmış.' })
    @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı.' })
    async approveDriver(@Param('id') id: string) {
        return this.userService.approveDriver(id);
    }

    @Patch(':id/reject')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Şoför başvurusunu reddet — PENDING_APPROVAL → SUSPENDED' })
    @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
    @ApiResponse({ status: 200, description: 'Başvuru reddedildi.' })
    async rejectDriver(@Param('id') id: string, @Body('reason') reason?: string) {
        return this.userService.rejectDriver(id, reason);
    }

    // ============================================================
    // Generic CRUD
    // ============================================================

    @Delete('me')
    @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Kendi hesabını sil (soft delete)' })
    @ApiResponse({ status: 200, description: 'Hesap silindi.' })
    async deleteMe(@Request() req: { user: { id: string } }) {
        return this.userService.deleteMe(req.user.id);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    async findOne(@Param('id') id: string, @Request() req: { user: { role: UserRole; id: string } }) {
        const user = await this.userService.findOne(id);
        if (req.user.role === UserRole.DRIVER && req.user.id !== id) {
            throw new ForbiddenException('Sadece kendi profilinize erişebilirsiniz.');
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
        @Request() req: { user: { role: UserRole; id: string } },
    ) {
        if (req.user.role === UserRole.DRIVER && req.user.id !== id) {
            throw new ForbiddenException('Sadece kendi profilinizi güncelleyebilirsiniz.');
        }
        if (req.user.role === UserRole.DRIVER && updateUserDto.role) {
            throw new ForbiddenException('Rolünüzü değiştiremezsiniz.');
        }
        return this.userService.update(id, updateUserDto);
    }

    @Get('deleted-users')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Silinmiş kullanıcıları listele' })
    getDeletedUsers() {
        return this.userService.getDeletedUsers();
    }

    @Patch(':id/restore')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Silinmiş kullanıcıyı geri getir (Restore)' })
    restore(@Param('id') id: string) {
        return this.userService.restore(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
        return this.userService.softDelete(id, req.user.id);
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMIN)
    updateRole(@Param('id') id: string, @Body('role') role: UserRole) {
        return this.userService.updateRole(id, role);
    }
}
