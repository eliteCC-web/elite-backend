// src/schedule/schedule.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, BulkCreateScheduleDto, AssignRandomShiftsDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedule')
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
  bulkCreate(@Body() bulkCreateDto: BulkCreateScheduleDto) {
    return this.scheduleService.bulkCreate(bulkCreateDto);
  }

  @Post('assign-random')
  @Roles('ADMIN')
  assignRandomShifts(@Body() assignDto: AssignRandomShiftsDto, @Request() req) {
    return this.scheduleService.assignRandomShifts(assignDto, req.user.id);
  }

  @Get('my-schedule')
  @Roles('COLABORADOR')
  findMySchedule(@Request() req) {
    return this.scheduleService.findByUser(req.user.id);
  }

  @Get('my-schedule/three-weeks')
  @Roles('COLABORADOR')
  getMyThreeWeeksSchedule(@Request() req) {
    return this.scheduleService.getThreeWeeksSchedule(req.user.id);
  }

  @Get('user/:id')
  @Roles('ADMIN')
  findByUser(@Param('id') id: string) {
    return this.scheduleService.findByUser(+id);
  }

  @Get('colaboradores')
  @Roles('ADMIN')
  getColaboradores() {
    return this.scheduleService.getColaboradores();
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
}