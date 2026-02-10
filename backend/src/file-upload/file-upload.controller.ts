import {
    Controller,
    Post,
    UseGuards,
    BadRequestException,
    Get,
    Param,
    Res,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('file-upload')
@Controller('file-upload')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) { }

    @Post('document')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a document (PDF, DOC, JPG, PNG)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
    async uploadDocument(@UploadedFile() file: Express.Multer.File) {
        console.log('📄 Upload Request Received');
        if (file) {
            console.log(`✅ File found: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size}`);
        } else {
            console.error('❌ No file received in request');
        }

        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.fileUploadService.uploadDocument(file);
    }

    @Post('profile-image')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload profile image (JPG, PNG, WEBP)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Profile image uploaded successfully' })
    async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.fileUploadService.uploadProfileImage(file);
    }

    @Post('invoice')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload invoice (PDF only)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Invoice uploaded successfully' })
    async uploadInvoice(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.fileUploadService.uploadInvoice(file);
    }

    @Post('multiple')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
    @ApiOperation({ summary: 'Upload multiple files' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
    async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }
        return this.fileUploadService.uploadMultiple(files);
    }

    @Get(':folder/:filename')
    async serveFile(
        @Param('folder') folder: string,
        @Param('filename') filename: string,
        @Res() res: Response
    ) {
        console.log(`📁 Serving file: ${folder}/${filename}`);
        const filePath = join(process.cwd(), 'uploads', folder, filename);
        console.log(`📂 Full path: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            throw new BadRequestException('File not found');
        }

        console.log(`✅ File exists, sending...`);
        return res.sendFile(filePath);
    }
}
