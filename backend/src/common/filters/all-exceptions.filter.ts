import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isHttpException = exception instanceof HttpException;
        const status = isHttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        // HTTP exception'larda mesajı al
        let message: string | object = 'Internal server error';
        if (isHttpException) {
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || exceptionResponse;
        }

        // Loglama — production'da stack trace gizle
        const isDev = process.env.NODE_ENV !== 'production';

        if (status >= 500) {
            Sentry.captureException(exception, {
                tags: { endpoint: request.url, method: request.method },
                user: { id: (request as any).user?.id, email: (request as any).user?.email },
            });
            this.logger.error(
                `[${request.method}] ${request.url} → ${status}`,
                isDev ? (exception as Error)?.stack : undefined,
            );
        } else {
            this.logger.warn(`[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)}`);
        }

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            // Stack trace SADECE development'ta döner
            ...(isDev && status >= 500 && {
                stack: (exception as Error)?.stack?.split('\n').slice(0, 5),
            }),
        });
    }
}
