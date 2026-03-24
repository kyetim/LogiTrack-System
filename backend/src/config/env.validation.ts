import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required()
        .messages({ 'any.required': 'DATABASE_URL tanımlı değil! .env dosyasını kontrol et.' }),
    JWT_SECRET: Joi.string().min(16).required()
        .messages({
            'any.required': 'JWT_SECRET tanımlı değil!',
            'string.min': 'JWT_SECRET en az 16 karakter olmalı!',
        }),
    JWT_REFRESH_SECRET: Joi.string().min(16).required()
        .messages({
            'any.required': 'JWT_REFRESH_SECRET tanımlı değil!',
            'string.min': 'JWT_REFRESH_SECRET en az 16 karakter olmalı!',
        }),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:3001'),
    THROTTLE_TTL: Joi.number().default(60000),
    THROTTLE_LIMIT: Joi.number().default(10),
    REDIS_URL: Joi.string().optional(),
    SMTP_HOST: Joi.string().optional(),
    SMTP_USER: Joi.string().optional(),
    SMTP_PASS: Joi.string().optional(),
    ADMIN_EMAIL: Joi.string().email().optional(),
    GOOGLE_MAPS_API_KEY: Joi.string().optional(),
    SENTRY_DSN: Joi.string().uri().optional().allow(''),
}).unknown(true);
