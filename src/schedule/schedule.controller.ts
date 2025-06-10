// src/schedule/schedule.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Post('bulk')
  @Roles('ADMIN')
  bulkCreate(@Body() schedules: CreateScheduleDto[]) {
    return this.scheduleService.bulkCreate(schedules);
  }

  @Get('user/:userId')
  @Roles('ADMIN', 'COLABORADOR')
  findByUser(@Param('userId') userId: string) {
    return this.scheduleService.findByUser(+userId);
  }

  @Get('user/:userId/three-weeks')
  @Roles('ADMIN', 'COLABORADOR')
  getThreeWeeksSchedule(@Param('userId') userId: string) {
    return this.scheduleService.getThreeWeeksSchedule(+userId);
  }

  @Get('user/:userId/week')
  @Roles('ADMIN', 'COLABORADOR')
  findByWeek(
    @Param('userId') userId: string,
    @Query('weekStart') weekStart: string
  ) {
    return this.scheduleService.findByWeek(+userId, new Date(weekStart));
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(+id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(+id);
  }
}