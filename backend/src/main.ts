import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure Socket.io adapter for WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration - Allow all origins for mobile app
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files from uploads directory
  app.useStaticAssets('uploads', {
    prefix: '/uploads/',
  });

  // Global API prefix (exclude Swagger docs and uploads)
  app.setGlobalPrefix('api', {
    exclude: ['docs', 'docs/(.*)', 'uploads', 'uploads/(.*)'],
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
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  console.log(`🚀 LogiTrack Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger API docs available at: http://localhost:${port}/docs`);
  console.log(`🔗 API endpoints available at: http://localhost:${port}/api/*`);
  console.log(`🌐 Network access: http://192.168.1.127:${port}/api/*`);
}

bootstrap();
