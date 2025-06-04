import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import * as crypto from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { AuthModule } from './auth/auth.module';
import { StoreModule } from './store/store.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    // Configuración
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Base de datos
    // Conexión a la base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'), // Obtén el connection string
        autoLoadEntities: true,
        synchronize: true, // En producción, cámbialo a false
        logging: true,
      }),
    }),
    
    // Módulos de la aplicación
    AuthModule, // Importante que este módulo vaya primero
    UserModule,
    RoleModule,
    PermissionModule,
    StoreModule,
    SeedModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Guardia global de JWT
    },
  ],
})
export class AppModule {}