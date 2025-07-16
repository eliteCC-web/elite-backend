// src/schedule/schedule.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, BulkCreateScheduleDto, AssignRandomShiftsDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ScheduleNotificationService } from './services/schedule-notification.service';

@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly notificationService: ScheduleNotificationService
  ) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Post('assign-random')
  @Roles('ADMIN')
  assignRandomShifts(@Body() assignDto: AssignRandomShiftsDto, @Request() req) {
    return this.scheduleService.assignRandomShifts(assignDto, req.user.id);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.scheduleService.findAll();
  }

  @Get('user/:id')
  @Roles('ADMIN', 'COLABORADOR')
  findByUser(@Param('id') id: string) {
    return this.scheduleService.findByUser(+id);
  }

  @Get('user/:id/three-weeks')
  @Roles('ADMIN', 'COLABORADOR')
  getThreeWeeksSchedule(@Param('id') id: string) {
    return this.scheduleService.getThreeWeeksSchedule(+id);
  }

  @Get('weekly')
  @Roles('ADMIN')
  getWeeklySchedule(@Query('weekStart') weekStart: string) {
    return this.scheduleService.getWeeklySchedule(new Date(weekStart));
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(+id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(+id);
  }

  @Get('colaboradores')
  @Roles('ADMIN')
  getColaboradores() {
    return this.scheduleService.getColaboradores();
  }

  // Nuevos endpoints para notificaciones
  @Post('notifications/send/:id')
  @Roles('ADMIN')
  async sendNotification(@Param('id') id: string) {
    await this.notificationService.sendScheduleNotification(+id);
    return { message: 'Notification sent successfully' };
  }

  @Post('notifications/send-bulk')
  @Roles('ADMIN')
  async sendBulkNotifications(@Body() body: { scheduleIds: number[] }) {
    await this.notificationService.sendBulkScheduleNotifications(body.scheduleIds);
    return { message: 'Bulk notifications sent successfully' };
  }

  @Post('notifications/reminder/:id')
  @Roles('ADMIN')
  async sendReminder(@Param('id') id: string) {
    await this.notificationService.sendScheduleReminder(+id);
    return { message: 'Reminder sent successfully' };
  }

  @Get('notifications/pending/:userId')
  @Roles('ADMIN', 'COLABORADOR')
  async getPendingNotifications(@Param('userId') userId: string) {
    return this.notificationService.getUserPendingNotifications(+userId);
  }
}