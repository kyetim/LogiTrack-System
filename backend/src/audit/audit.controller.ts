import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll(@Query() pagination: PaginationDto) {
        return this.auditService.findAll(pagination);
    }
}
