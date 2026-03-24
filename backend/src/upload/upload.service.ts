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

    async saveBase64Image(base64Data: string, type: 'signature' | 'photo' = 'signature'): Promise<string> {
        const fs = require('fs');
        const path = require('path');

        // Remove header if present (e.g., "data:image/png;base64,")
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        let extension = 'png';

        if (matches && matches.length === 3) {
            // Buffer from match
            buffer = Buffer.from(matches[2], 'base64');
            // Try to guess extension from mime type
            const mime = matches[1];
            if (mime === 'image/jpeg') extension = 'jpg';
        } else {
            // Assuming raw base64
            buffer = Buffer.from(base64Data, 'base64');
        }

        const filename = `${uuidv4()}.${extension}`;
        const uploadDir = type === 'signature' ? './uploads/signatures' : './uploads/photos';
        const filePath = path.join(uploadDir, filename);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        await fs.promises.writeFile(filePath, buffer);

        return filename;
    }
}
