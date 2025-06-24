// src/event/event.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RegisterEventDto } from './dto/register-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../common/interfaces/pagination.dto';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Roles('ADMIN', 'COLABORADOR')
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @Public()
  findAll(@Query() paginationDto: PaginationDto, @Query() filters: any) {
    return this.eventService.findAll(paginationDto, filters);
  }

  @Get('featured')
  @Public()
  getFeatured() {
    return this.eventService.getFeatured();
  }

  @Get('upcoming')
  @Public()
  getUpcoming() {
    return this.eventService.getUpcoming();
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.eventService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(+id);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLABORADOR')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(+id, updateEventDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.eventService.remove(+id);
  }

  @Post('register')
  @Roles('ADMIN', 'COLABORADOR', 'CLIENTE_INTERNO', 'CLIENTE_EXTERNO')
  registerUser(@Body() registerEventDto: RegisterEventDto) {
    return this.eventService.registerUser(registerEventDto);
  }

  @Delete(':eventId/unregister/:userId')
  @Roles('ADMIN', 'COLABORADOR', 'CLIENTE_INTERNO', 'CLIENTE_EXTERNO')
  unregisterUser(@Param('eventId') eventId: string, @Param('userId') userId: string) {
    return this.eventService.unregisterUser(+eventId, +userId);
  }
}