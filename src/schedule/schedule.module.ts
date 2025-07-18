// src/schedule/schedule.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Schedule } from './entities/schedule.entity';
import { User } from '../user/entities/user.entity';
import { ScheduleNotificationService } from './services/schedule-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, User])
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleNotificationService],
  exports: [ScheduleService]
})
export class ScheduleModule {}