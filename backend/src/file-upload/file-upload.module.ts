import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';

@Global() // Make it available globally
@Module({
    imports: [
        MulterModule.register({
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB max
            },
        }),
    ],
    controllers: [FileUploadController],
    providers: [FileUploadService],
    exports: [FileUploadService],
})
export class FileUploadModule { }
