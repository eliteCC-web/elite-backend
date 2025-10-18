// src/schedule/schedule.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { User } from '../user/entities/user.entity';
import { CreateScheduleDto, BulkCreateScheduleDto, AssignRandomShiftsDto, BulkEquitativeAssignDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleNotificationService } from './services/schedule-notification.service';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: ScheduleNotificationService
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const user = await this.userRepository.findOne({
      where: { id: createScheduleDto.userId },
      relations: ['roles']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createScheduleDto.userId} not found`);
    }

    // Verificar que el usuario sea colaborador
    const isColaborador = user.roles?.some(role => role.name === 'COLABORADOR');
    if (!isColaborador) {
      throw new BadRequestException('Only colaboradores can have schedules');
    }

    // Parse date properly to avoid timezone issues
    const dateString = createScheduleDto.date;
    let parsedDate: Date;
    
    if (dateString.includes('T')) {
      // If it's already in ISO format, parse it directly
      parsedDate = new Date(dateString);
    } else {
      // If it's just a date string (YYYY-MM-DD), create it in local timezone
      const [year, month, day] = dateString.split('-').map(Number);
      parsedDate = new Date(year, month - 1, day); // month is 0-indexed
    }
    
    console.log('Original date string:', dateString);
    console.log('Parsed date:', parsedDate);
    console.log('Parsed date ISO:', parsedDate.toISOString());
    
    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      date: parsedDate,
      user
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);

    console.log('✅ [ScheduleService] Schedule saved successfully!');
    console.log('🆔 [ScheduleService] Saved schedule ID:', savedSchedule.id);
    console.log('👤 [ScheduleService] User:', savedSchedule.user?.firstName, savedSchedule.user?.lastName);
    console.log('📧 [ScheduleService] User email:', savedSchedule.user?.email);

    // Enviar notificación por email
    console.log('📤 [ScheduleService] Starting notification process...');
    try {
      console.log('🔔 [ScheduleService] Calling notificationService.sendScheduleNotification...');
      await this.notificationService.sendScheduleNotification(savedSchedule.id);
      console.log('✅ [ScheduleService] Notification sent successfully!');
    } catch (error) {
      console.error('❌ [ScheduleService] Error sending schedule notification:', error);
      // No lanzamos el error para no afectar la creación del turno
    }

    return savedSchedule;
  }

  async findByUser(userId: number): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: { userId },
      order: { date: 'ASC' }
    });
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      relations: ['user'],
      order: { date: 'ASC', startTime: 'ASC' }
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

  async bulkCreate(bulkCreateDto: BulkCreateScheduleDto): Promise<Schedule[]> {
    const results = [];
    for (const scheduleDto of bulkCreateDto.schedules) {
      try {
        const schedule = await this.create(scheduleDto);
        results.push(schedule);
      } catch (error) {
        console.error(`Error creating schedule for user ${scheduleDto.userId}:`, error);
      }
    }
    return results;
  }

  async assignRandomShifts(assignDto: AssignRandomShiftsDto, adminId: number): Promise<Schedule[]> {
    const { weekStartDate, userIds, shiftPattern = 'ROTATING' } = assignDto;
    
    // Verificar que todos los usuarios existan y sean colaboradores
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      relations: ['roles']
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('Some users not found');
    }

    const colaboradores = users.filter(user => 
      user.roles?.some(role => role.name === 'COLABORADOR')
    );

    if (colaboradores.length !== userIds.length) {
      throw new BadRequestException('All users must be colaboradores');
    }

    const weekStart = new Date(weekStartDate);
    const schedules: CreateScheduleDto[] = [];

    // Definir patrones de turnos
    const shiftPatterns = {
      MORNING: { startTime: '08:00', endTime: '16:00', shiftType: 'MORNING' },
      AFTERNOON: { startTime: '16:00', endTime: '00:00', shiftType: 'AFTERNOON' },
      NIGHT: { startTime: '00:00', endTime: '08:00', shiftType: 'NIGHT' },
      FULL_DAY: { startTime: '08:00', endTime: '18:00', shiftType: 'FULL_DAY' }
    };

    // Generar horarios para toda la semana (incluyendo sábados y domingos)
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + day);

      colaboradores.forEach((user, index) => {
        let shiftConfig;
        
        switch (shiftPattern) {
          case 'ROTATING':
            // Rotar turnos entre mañana, tarde y noche
            const shiftTypes = ['MORNING', 'AFTERNOON', 'NIGHT'];
            const shiftIndex = (day + index) % shiftTypes.length;
            shiftConfig = shiftPatterns[shiftTypes[shiftIndex]];
            break;
          case 'FIXED':
            // Turno fijo basado en el índice del usuario
            const fixedShifts = ['MORNING', 'AFTERNOON', 'NIGHT'];
            const fixedIndex = index % fixedShifts.length;
            shiftConfig = shiftPatterns[fixedShifts[fixedIndex]];
            break;
          case 'CUSTOM':
            // Turno personalizado (todos full day)
            shiftConfig = shiftPatterns.FULL_DAY;
            break;
          default:
            shiftConfig = shiftPatterns.FULL_DAY;
        }

        schedules.push({
          userId: user.id,
          date: currentDate.toISOString().split('T')[0],
          startTime: shiftConfig.startTime,
          endTime: shiftConfig.endTime,
          shiftType: shiftConfig.shiftType,
          position: user.roles?.[0]?.name || 'COLABORADOR'
        });
      });
    }

    // Crear todos los horarios
    const createdSchedules = await this.bulkCreate({ weekStartDate, schedules });

    // Enviar notificaciones por email para cada turno creado
    for (const schedule of createdSchedules) {
      try {
        await this.notificationService.sendScheduleNotification(schedule.id);
      } catch (error) {
        console.error(`Error sending notification for schedule ${schedule.id}:`, error);
      }
    }

    return createdSchedules;
  }

  async getColaboradores(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles'],
      where: {
        roles: {
          name: 'COLABORADOR'
        }
      }
    });
  }

  async getWeeklySchedule(weekStart: Date): Promise<Schedule[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return this.scheduleRepository.find({
      where: {
        date: Between(weekStart, weekEnd)
      },
      relations: ['user'],
      order: { date: 'ASC', startTime: 'ASC' }
    });
  }

  /**
   * Asignar turnos de manera equitativa y aleatoria
   * Distribuye los turnos entre múltiples colaboradores en un rango de fechas
   * de manera que cada uno reciba la misma cantidad de turnos pero en días aleatorios
   */
  async bulkEquitativeAssign(assignDto: BulkEquitativeAssignDto, adminId: number): Promise<Schedule[]> {
    const { userIds, startDate, endDate, startTime, endTime, shiftType, notes } = assignDto;
    
    // Verificar que todos los usuarios existan y sean colaboradores
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      relations: ['roles']
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('Some users not found');
    }

    const colaboradores = users.filter(user => 
      user.roles?.some(role => role.name === 'COLABORADOR')
    );

    if (colaboradores.length !== userIds.length) {
      throw new BadRequestException('All users must be colaboradores');
    }

    // Generar array de fechas en el rango
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📅 Generando turnos para ${dates.length} días entre ${colaboradores.length} colaboradores`);

    // Calcular cuántos turnos debe recibir cada colaborador
    const totalDays = dates.length;
    const totalUsers = colaboradores.length;
    const turnosPerUser = Math.floor(totalDays / totalUsers);
    const extraTurnos = totalDays % totalUsers; // Turnos sobrantes

    console.log(`📊 Total días: ${totalDays}`);
    console.log(`👥 Total colaboradores: ${totalUsers}`);
    console.log(`🎯 Turnos por colaborador: ${turnosPerUser}`);
    console.log(`➕ Turnos extra a distribuir: ${extraTurnos}`);

    // Crear un array con todas las fechas disponibles
    const availableDates = [...dates];
    
    // Mezclar aleatoriamente las fechas usando Fisher-Yates shuffle
    for (let i = availableDates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableDates[i], availableDates[j]] = [availableDates[j], availableDates[i]];
    }

    console.log(`🔀 Fechas mezcladas aleatoriamente`);

    // Asignar turnos de manera equitativa
    const schedules: CreateScheduleDto[] = [];
    let dateIndex = 0;

    // Asignar turnos base a cada colaborador
    for (let userIndex = 0; userIndex < colaboradores.length; userIndex++) {
      const user = colaboradores[userIndex];
      // Algunos usuarios recibirán un turno extra
      const turnosForThisUser = turnosPerUser + (userIndex < extraTurnos ? 1 : 0);
      
      console.log(`👤 Asignando ${turnosForThisUser} turnos a ${user.firstName} ${user.lastName}`);

      for (let t = 0; t < turnosForThisUser; t++) {
        if (dateIndex < availableDates.length) {
          const assignedDate = availableDates[dateIndex];
          schedules.push({
            userId: user.id,
            date: assignedDate.toISOString().split('T')[0],
            startTime,
            endTime,
            shiftType: shiftType || 'FULL_DAY',
            position: user.roles?.[0]?.name || 'COLABORADOR',
            notes
          });
          dateIndex++;
        }
      }
    }

    console.log(`✅ Total de turnos generados: ${schedules.length}`);

    // Crear todos los horarios
    const createdSchedules = await this.bulkCreate({ 
      weekStartDate: startDate, 
      schedules 
    });

    console.log(`💾 Turnos guardados en base de datos: ${createdSchedules.length}`);

    // Enviar notificaciones por email para cada turno creado
    console.log(`📧 Iniciando envío de notificaciones...`);
    for (const schedule of createdSchedules) {
      try {
        await this.notificationService.sendScheduleNotification(schedule.id);
      } catch (error) {
        console.error(`❌ Error sending notification for schedule ${schedule.id}:`, error);
      }
    }

    console.log(`✨ Proceso de asignación masiva completado`);

    return createdSchedules;
  }
}