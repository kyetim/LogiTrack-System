import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AddUserToCompanyDto } from './dto/add-user-to-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.COMPANY_OWNER)
    @ApiOperation({ summary: 'Create a new company' })
    @ApiResponse({ status: 201, description: 'Company created successfully' })
    @ApiResponse({ status: 409, description: 'Company with this tax number already exists' })
    create(@Body() createCompanyDto: CreateCompanyDto) {
        return this.companyService.create(createCompanyDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.COMPANY_OWNER, UserRole.COMPANY_MANAGER)
    @ApiOperation({ summary: 'Get all companies with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
    findAll(@Query('page') page: string, @Query('limit') limit: string) {
        return this.companyService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10
        );
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.COMPANY_OWNER, UserRole.COMPANY_MANAGER)
    @ApiOperation({ summary: 'Get company by ID' })
    @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Company not found' })
    findOne(@Param('id') id: string) {
        return this.companyService.findOne(id);
    }

    @Get(':id/statistics')
    @Roles(UserRole.ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_MANAGER)
    @ApiOperation({ summary: 'Get company statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Company not found' })
    getStatistics(@Param('id') id: string) {
        return this.companyService.getStatistics(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.COMPANY_OWNER)
    @ApiOperation({ summary: 'Update company information' })
    @ApiResponse({ status: 200, description: 'Company updated successfully' })
    @ApiResponse({ status: 404, description: 'Company not found' })
    @ApiResponse({ status: 409, description: 'Tax number already in use' })
    update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
        return this.companyService.update(id, updateCompanyDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Soft delete company (deactivate)' })
    @ApiResponse({ status: 200, description: 'Company deactivated successfully' })
    @ApiResponse({ status: 404, description: 'Company not found' })
    remove(@Param('id') id: string) {
        return this.companyService.remove(id);
    }

    @Delete(':id/hard')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Permanently delete company' })
    @ApiResponse({ status: 200, description: 'Company deleted permanently' })
    @ApiResponse({ status: 400, description: 'Cannot delete company with active data' })
    @ApiResponse({ status: 404, description: 'Company not found' })
    hardDelete(@Param('id') id: string) {
        return this.companyService.hardDelete(id);
    }

    @Post(':id/users')
    @Roles(UserRole.ADMIN, UserRole.COMPANY_OWNER)
    @ApiOperation({ summary: 'Add user to company' })
    @ApiResponse({ status: 201, description: 'User added to company successfully' })
    @ApiResponse({ status: 404, description: 'Company or user not found' })
    @ApiResponse({ status: 409, description: 'User is already a member' })
    addUser(@Param('id') id: string, @Body() addUserDto: AddUserToCompanyDto) {
        return this.companyService.addUser(id, addUserDto);
    }

    @Delete(':id/users/:userId')
    @Roles(UserRole.ADMIN, UserRole.COMPANY_OWNER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove user from company' })
    @ApiResponse({ status: 200, description: 'User removed from company successfully' })
    @ApiResponse({ status: 404, description: 'User is not a member of this company' })
    removeUser(@Param('id') id: string, @Param('userId') userId: string) {
        return this.companyService.removeUser(id, userId);
    }
}
