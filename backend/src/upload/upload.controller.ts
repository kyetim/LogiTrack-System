import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('photo')
    @UseInterceptors(
        FileInterceptor('file', {
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

        console.log('📸 Photo uploaded:', file.filename);

        return {
            filename: file.filename,
            path: `/uploads/photos/${file.filename}`,
            url: `http://192.168.1.125:4000/uploads/photos/${file.filename}`,
        };
    }

    @Post('signature')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 2 * 1024 * 1024, // 2MB
            },
        }),
    )
    async uploadSignature(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        console.log('✍️ Signature uploaded:', file.filename);

        return {
            filename: file.filename,
            path: `/uploads/signatures/${file.filename}`,
            url: `http://192.168.1.125:4000/uploads/signatures/${file.filename}`,
        };
    }

    @Post('signature-base64')
    async uploadSignatureBase64(@Body() body: { image: string }) {
        if (!body.image) {
            throw new BadRequestException('No image data provided');
        }

        const filename = await this.uploadService.saveBase64Image(body.image, 'signature');
        console.log('✍️ Signature (Base64) uploaded:', filename);

        return {
            filename: filename,
            path: `/uploads/signatures/${filename}`,
            url: `http://192.168.1.125:4000/uploads/signatures/${filename}`,
        };
    }
}
