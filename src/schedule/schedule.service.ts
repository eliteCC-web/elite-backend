// src/schedule/schedule.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { User } from '../user/entities/user.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const user = await this.userRepository.findOne({
      where: { id: createScheduleDto.userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createScheduleDto.userId} not found`);
    }

    // Verificar que el usuario sea colaborador
    const isColaborador = user.roles?.some(role => role.name === 'COLABORADOR');
    if (!isColaborador) {
      throw new BadRequestException('Only colaboradores can have schedules');
    }

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      date: new Date(createScheduleDto.date),
      user
    });

    return this.scheduleRepository.save(schedule);
  }

  async findByUser(userId: number): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: { userId },
      order: { date: 'ASC' }
    });
  }

  async findByUserAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate)
      },
      order: { date: 'ASC' }
    });
  }

  async findByWeek(userId: number, weekStart: Date): Promise<Schedule[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return this.findByUserAndDateRange(userId, weekStart, weekEnd);
  }

  async getThreeWeeksSchedule(userId: number): Promise<{
    lastWeek: Schedule[];
    currentWeek: Schedule[];
    nextWeek: Schedule[];
  }> {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Domingo

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const [lastWeek, currentWeek, nextWeek] = await Promise.all([
      this.findByWeek(userId, lastWeekStart),
      this.findByWeek(userId, currentWeekStart),
      this.findByWeek(userId, nextWeekStart)
    ]);

    return { lastWeek, currentWeek, nextWeek };
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.scheduleRepository.preload({
      id,
      ...updateScheduleDto,
      ...(updateScheduleDto.date && { date: new Date(updateScheduleDto.date) })
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return this.scheduleRepository.save(schedule);
  }

  async remove(id: number): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    await this.scheduleRepository.remove(schedule);
  }

  async bulkCreate(schedules: CreateScheduleDto[]): Promise<Schedule[]> {
    const results = [];
    for (const scheduleDto of schedules) {
      try {
        const schedule = await this.create(scheduleDto);
        results.push(schedule);
      } catch (error) {
        console.error(`Error creating schedule for user ${scheduleDto.userId}:`, error);
      }
    }
    return results;
  }
}