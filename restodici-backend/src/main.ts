// src/main.ts
import 'dotenv/config'; // ← charge .env avant tout le reste
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // PRÉFIXE GLOBAL OBLIGATOIRE
  app.setGlobalPrefix('api');

  // Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — origines autorisées (dev hardcodé + production via FRONTEND_URL)
  const corsOrigins: string[] = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:62758',
    'http://localhost:64096',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:62758',
    'http://127.0.0.1:64096',
    'http://192.168.1.5:5173',
    'http://192.168.1.5:5174',
    'http://192.168.1.5:3000',
    'http://192.168.1.5:62758',
    'http://192.168.1.5:64096',
  ];
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
    corsOrigins.push(frontendUrl);
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(`API Resto d'ici démarrée sur http://localhost:${port}/api`);
}
void bootstrap();
