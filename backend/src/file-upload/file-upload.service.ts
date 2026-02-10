import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { extname } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
    private logger = new Logger('FileUploadService');
    private uploadDir = './uploads'; // Local storage directory

    constructor() {
        this.ensureUploadDir();
    }

    /**
     * Ensure upload directory exists
     */
    private async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
            this.logger.log(`Created upload directory: ${this.uploadDir}`);
        }
    }

    /**
     * Validate file type
     */
    private validateFileType(filename: string, allowedMimeTypes: string[]): boolean {
        const ext = extname(filename).toLowerCase();
        const mimeMap: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        const mimeType = mimeMap[ext];
        return allowedMimeTypes.includes(mimeType);
    }

    /**
     * Upload file to local storage
     * In production, this should upload to S3/Cloud Storage
     */
    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'general'
    ): Promise<{
        filename: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
    }> {
        try {
            // Generate unique filename
            const ext = extname(file.originalname);
            const filename = `${uuidv4()}${ext}`;
            const folderPath = `${this.uploadDir}/${folder}`;

            // Ensure folder exists
            await fs.mkdir(folderPath, { recursive: true });

            // Save file locally
            const filepath = `${folderPath}/${filename}`;
            await fs.writeFile(filepath, file.buffer);

            const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/file-upload/${folder}/${filename}`;

            this.logger.log(`File uploaded: ${filename} (${file.size} bytes)`);

            return {
                filename,
                fileUrl,
                fileSize: file.size,
                mimeType: file.mimetype,
            };
        } catch (error) {
            this.logger.error('File upload failed', error);
            throw new BadRequestException('File upload failed');
        }
    }

    /**
     * Upload multiple files
     */
    async uploadMultiple(
        files: Express.Multer.File[],
        folder: string = 'general'
    ) {
        const uploadPromises = files.map((file) => this.uploadFile(file, folder));
        return Promise.all(uploadPromises);
    }

    /**
     * Delete file from local storage
     */
    async deleteFile(filepath: string): Promise<void> {
        try {
            await fs.unlink(filepath);
            this.logger.log(`File deleted: ${filepath}`);
        } catch (error) {
            this.logger.error(`Failed to delete file: ${filepath}`, error);
        }
    }

    /**
     * Upload document (specific for document module)
     */
    async uploadDocument(file: Express.Multer.File) {
        // Validate document types
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX');
        }

        // Max size: 10MB
        if (file.size > 10 * 1024 * 1024) {
            throw new BadRequestException('File too large. Max size: 10MB');
        }

        return this.uploadFile(file, 'documents');
    }

    /**
     * Upload profile image
     */
    async uploadProfileImage(file: Express.Multer.File) {
        // Validate image types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException('Invalid image type. Allowed: JPG, PNG, WEBP');
        }

        // Max size: 5MB
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('Image too large. Max size: 5MB');
        }

        return this.uploadFile(file, 'profiles');
    }

    /**
     * Upload invoice file
     */
    async uploadInvoice(file: Express.Multer.File) {
        // Only PDF for invoices
        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestException('Invalid file type. Only PDF allowed for invoices');
        }

        // Max size: 5MB
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('File too large. Max size: 5MB');
        }

        return this.uploadFile(file, 'invoices');
    }

    /**
     * Get file info
     */
    async getFileInfo(filepath: string) {
        try {
            const stats = await fs.stat(filepath);
            return {
                exists: true,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
            };
        } catch {
            return { exists: false };
        }
    }
}
