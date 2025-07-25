// Importar polyfills primero
import './polyfills';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe()); // <-- Necesario
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');
  
  // Configuración CORS
  app.enableCors({
    origin: ['https://www.elitecentrocomercial.com', 'https://elitecentrocomercial.com', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://elite-frontend.railway.app', 'https://elite-cc.vercel.app'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 horas
  });
  
  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no esperadas
      forbidNonWhitelisted: true, // Rechaza peticiones con propiedades no esperadas
      transform: true, // Transforma automáticamente los datos a los tipos especificados
    }),
  );
  
  // Middlewares
  app.use(cookieParser());
  
  // Middleware para loggear todas las peticiones
  app.use((req, res, next) => {
    console.log(`🌐 [Global] ${req.method} ${req.url}`);
    console.log(`📋 [Global] Headers:`, req.headers);
    console.log(`📦 [Global] Body:`, req.body);
    next();
  });
  
  // Puerto de la aplicación
  const port = configService.get('PORT') || 3001;
  
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}

bootstrap();