import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
    private readonly SKIP_FIELDS = [
        'password', 'currentPassword', 'newPassword', 'confirmPassword',
        'token', 'access_token', 'refresh_token', 'secret', 'passwordHash',
    ];

    transform(value: any, metadata: ArgumentMetadata) {
        if (metadata.type !== 'body') return value;
        if (typeof value === 'string') return this.sanitize(value);
        if (typeof value === 'object' && value !== null) return this.sanitizeObject(value);
        return value;
    }

    private sanitize(value: string): string {
        return sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
            disallowedTagsMode: 'recursiveEscape',
        }).trim();
    }

    private sanitizeObject(obj: any): any {
        const result: any = Array.isArray(obj) ? [] : {};
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (this.SKIP_FIELDS.includes(key)) {
                result[key] = val;
            } else if (typeof val === 'string') {
                result[key] = this.sanitize(val);
            } else if (typeof val === 'object' && val !== null) {
                result[key] = this.sanitizeObject(val);
            } else {
                result[key] = val;
            }
        }
        return result;
    }
}
