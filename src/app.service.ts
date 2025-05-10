// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'online',
      name: 'Elite Shopping Center API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}