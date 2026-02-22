import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;

        // We only want to log state-changing requests
        if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            return next.handle();
        }

        const url = req.url;
        const body = req.body;
        const user = req.user; // Set by JwtAuthGuard
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];

        // Determine Entity Type simply based on URL (heuristic)
        let entityType = 'UNKNOWN';
        if (url.includes('/shipments')) entityType = 'SHIPMENT';
        else if (url.includes('/users')) entityType = 'USER';
        else if (url.includes('/drivers')) entityType = 'DRIVER';
        else if (url.includes('/vehicles')) entityType = 'VEHICLE';
        else if (url.includes('/auth/login')) entityType = 'AUTH';
        else if (url.includes('/companies')) entityType = 'COMPANY';
        else if (url.includes('/support')) entityType = 'SUPPORT';

        // Determine Action
        let action: AuditAction = AuditAction.UPDATE;
        if (method === 'POST') {
            action = url.includes('login') ? AuditAction.LOGIN : AuditAction.CREATE;
        } else if (method === 'DELETE') {
            action = AuditAction.DELETE;
        }

        // Entity ID from params if available
        const entityId = req.params?.id || null;

        // Handle the request and capture response
        return next.handle().pipe(
            tap((response) => {
                // If the request succeeds, we log it asynchronously
                this.auditService.createLog({
                    userId: user?.id || null, // Might be null on login/register
                    action,
                    entityType,
                    entityId,
                    newValues: body ? body : null, // Logging the submitted body
                    ipAddress,
                    userAgent,
                    details: `${method} ${url}`,
                }).catch(err => {
                    console.error('Failed to save audit log:', err);
                });
            }),
        );
    }
}
