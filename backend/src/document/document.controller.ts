import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Query,
    Patch,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }

    @Post('upload')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Upload a new document' })
    @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
    uploadDocument(@Body() uploadDocumentDto: UploadDocumentDto) {
        return this.documentService.uploadDocument(uploadDocumentDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get all documents with filters' })
    @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
    findAll(@Query() filters: FilterDocumentDto) {
        return this.documentService.findAll(filters);
    }

    @Get('my')
    @Roles(UserRole.DRIVER)
    @ApiOperation({ summary: 'Get my documents (Driver only)' })
    @ApiResponse({ status: 200, description: 'My documents retrieved successfully' })
    async getMyDocuments(@Request() req) {
        console.log('📄 getMyDocuments called');
        console.log('👤 User from Req:', req.user);

        try {
            if (!req.user || !req.user.id) {
                console.error('❌ User ID not found in request');
                throw new Error('User ID missing');
            }

            const docs = await this.documentService.findMyDocuments(req.user.id);
            console.log(`✅ Found ${docs.length} documents`);
            return docs;
        } catch (error) {
            console.error('❌ Error in getMyDocuments:', error);
            throw error;
        }
    }

    @Get('statistics')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get document statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    getStatistics() {
        return this.documentService.getStatistics();
    }

    @Get('expiring')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Get expiring documents' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days ahead (default: 30)' })
    @ApiResponse({ status: 200, description: 'Expiring documents retrieved successfully' })
    getExpiringDocuments(@Query('days') days?: string) {
        const daysAhead = days ? parseInt(days, 10) : 30;
        return this.documentService.getExpiringDocuments(daysAhead);
    }

    @Get('entity/:entityType/:entityId')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get documents for a specific entity' })
    @ApiResponse({ status: 200, description: 'Entity documents retrieved successfully' })
    getEntityDocuments(
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
    ) {
        return this.documentService.getEntityDocuments(entityType, entityId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Get document by ID' })
    @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    findOne(@Param('id') id: string) {
        return this.documentService.findOne(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
    @ApiOperation({ summary: 'Delete a document' })
    @ApiResponse({ status: 200, description: 'Document deleted successfully' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    remove(@Param('id') id: string, @Request() req) {
        return this.documentService.remove(id, req.user);
    }

    @Post(':id/verify')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Verify a document (admin only)' })
    @ApiResponse({ status: 200, description: 'Document verified successfully' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    verifyDocument(@Param('id') id: string, @Request() req) {
        return this.documentService.verifyDocument(id, req.user.id);
    }

    @Patch(':id/expiry')
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    @ApiOperation({ summary: 'Update document expiry date' })
    @ApiResponse({ status: 200, description: 'Expiry date updated successfully' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    updateExpiryDate(
        @Param('id') id: string,
        @Body('expiryDate') expiryDate: string,
    ) {
        return this.documentService.updateExpiryDate(id, expiryDate);
    }
}
