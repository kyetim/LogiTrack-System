import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    // Multer configuration for photos
    getPhotoStorage() {
        return diskStorage({
            destination: './uploads/photos',
            filename: (req, file, callback) => {
                const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                callback(null, uniqueName);
            },
        });
    }

    // Multer configuration for signatures
    getSignatureStorage() {
        return diskStorage({
            destination: './uploads/signatures',
            filename: (req, file, callback) => {
                const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                callback(null, uniqueName);
            },
        });
    }

    // File filter for images only
    imageFileFilter(req: any, file: any, callback: any) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
    }
}
