import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('photo')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: null, // Will be set dynamically
            fileFilter: (req, file, callback) => {
                if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                    return callback(new BadRequestException('Only image files are allowed!'), false);
                }
                callback(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        return {
            filename: file.filename,
            path: `/uploads/photos/${file.filename}`,
            url: `${process.env.API_URL || 'http://localhost:4000'}/uploads/photos/${file.filename}`,
        };
    }

    @Post('signature')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: null, // Will be set dynamically
            fileFilter: (req, file, callback) => {
                if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                    return callback(new BadRequestException('Only image files are allowed!'), false);
                }
                callback(null, true);
            },
            limits: {
                fileSize: 2 * 1024 * 1024, // 2MB
            },
        }),
    )
    async uploadSignature(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        return {
            filename: file.filename,
            path: `/uploads/signatures/${file.filename}`,
            url: `${process.env.API_URL || 'http://localhost:4000'}/uploads/signatures/${file.filename}`,
        };
    }
}
