// src/event/event.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { Event } from './entities/event.entity';
import { User } from '../user/entities/user.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { EmailNotificationService } from './services/email-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, User, EventRegistration])],
  controllers: [EventController],
  providers: [EventService, EmailNotificationService],
  exports: [EventService]
})
export class EventModule {}