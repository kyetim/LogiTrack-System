import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './common/logger/winston.logger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: !!process.env.SENTRY_DSN, // DSN yoksa devre dışı
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    beforeSend(event) {
      // Hassas alanları Sentry'e gönderme
      if (event.request?.data) {
        const data = event.request.data as any;
        if (data.password) data.password = '***';
        if (data.token) data.token = '***';
      }
      return event;
    },
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });

  // Configure Socket.io adapter for WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  // HTTP Güvenlik Başlıkları
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Swagger için gerekli
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  app.use(cookieParser());

  // Body Boyut Sınırı (Body Bomb koruması — 10kb üstü istekler reddedilir ama 1mb ayarlandı)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration — strict origin check based on environment
  const rawOrigins = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Postman/curl gibi origin'siz isteklere izin ver (development'ta)
      if (!origin || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: ${origin} origin'e izin verilmiyor`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files from uploads directory
  app.useStaticAssets('uploads', {
    prefix: '/uploads/',
  });

  // Global API prefix (exclude Swagger docs, uploads, and file-upload)
  app.setGlobalPrefix('api', {
    exclude: [
      'docs', 'docs/(.*)',
      'uploads', 'uploads/(.*)',
      'file-upload', 'file-upload/(.*)',
      'health', 'health/(.*)',
    ],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('LogiTrack API')
    .setDescription('Logistics tracking and fleet management system')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('drivers', 'Driver management')
    .addTag('vehicles', 'Vehicle fleet management')
    .addTag('shipments', 'Shipment tracking')
    .addTag('locations', 'GPS location tracking')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;

  console.log(`⚙️  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Tanımlı' : '✗ EKSİK!'}`);
  console.log(`🔄 JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? '✓ Tanımlı' : '✗ EKSİK!'}`);
  console.log(`🌐 ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS}`);

  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  console.log(`🚀 LogiTrack Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger API docs available at: http://localhost:${port}/docs`);
  console.log(`🔗 API endpoints available at: http://localhost:${port}/api/*`);
  console.log(`🌐 Network access: http://localhost:${port}/api/* (server listens on 0.0.0.0)`);
}

bootstrap();
