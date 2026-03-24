import * as winston from 'winston';

const { combine, timestamp, json, errors, colorize, simple } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

export const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        isDev
            ? combine(colorize(), simple()) // Development'ta renkli, okunabilir
            : json() // Production'da JSON (log aggregation için)
    ),
    defaultMeta: {
        service: 'logitrack-backend',
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV,
    },
    transports: [
        new winston.transports.Console(),
        // Production'da dosyaya da yaz
        ...(!isDev ? [
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' }),
        ] : []),
    ],
});
