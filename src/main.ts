import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as crypto from 'crypto';
(global as any).crypto = crypto;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe()); // <-- Necesario
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');
  
  // Configuración CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
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
  
  // Puerto de la aplicación
  const port = configService.get('PORT') || 3001;
  
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}

bootstrap();