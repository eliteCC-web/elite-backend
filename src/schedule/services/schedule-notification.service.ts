import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class ScheduleNotificationService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendScheduleNotification(scheduleId: number): Promise<void> {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['user'],
      });

      if (!schedule) {
        console.log(`Schedule with ID ${scheduleId} not found`);
        return;
      }

      // Aquí puedes implementar la lógica de notificación
      // Por ejemplo, enviar email, SMS, push notification, etc.
      console.log(`Sending notification for schedule ${scheduleId} to user ${schedule.user?.firstName} ${schedule.user?.lastName}`);
      
      // Ejemplo de implementación de notificación por email
      // await this.sendEmailNotification(schedule);
      
      // Ejemplo de implementación de notificación por SMS
      // await this.sendSMSNotification(schedule);
      
    } catch (error) {
      console.error('Error sending schedule notification:', error);
    }
  }

  async sendScheduleReminder(scheduleId: number): Promise<void> {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['user'],
      });

      if (!schedule) {
        console.log(`Schedule with ID ${scheduleId} not found for reminder`);
        return;
      }

      // Lógica para enviar recordatorio
      console.log(`Sending reminder for schedule ${scheduleId} to user ${schedule.user?.firstName} ${schedule.user?.lastName}`);
      
    } catch (error) {
      console.error('Error sending schedule reminder:', error);
    }
  }

  async sendBulkScheduleNotifications(scheduleIds: number[]): Promise<void> {
    try {
      for (const scheduleId of scheduleIds) {
        await this.sendScheduleNotification(scheduleId);
      }
    } catch (error) {
      console.error('Error sending bulk schedule notifications:', error);
    }
  }

  // Método para verificar si un usuario tiene notificaciones pendientes
  async getUserPendingNotifications(userId: number): Promise<Schedule[]> {
    try {
      const today = new Date();
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      const schedules = await this.scheduleRepository.find({
        where: {
          userId: userId,
          date: Between(start, end),
        },
        relations: ['user'],
      });

      return schedules;
    } catch (error) {
      console.error('Error getting user pending notifications:', error);
      return [];
    }
  }

  // Método para marcar una notificación como enviada
  async markNotificationAsSent(scheduleId: number): Promise<void> {
    try {
      // Por ahora solo logueamos que la notificación fue enviada
      // En el futuro se pueden agregar campos a la entidad Schedule
      console.log(`Notification marked as sent for schedule ${scheduleId}`);
      
      // Si se quiere agregar campos a la entidad Schedule, descomentar:
      // await this.scheduleRepository.update(scheduleId, {
      //   notificationSent: true,
      //   notificationSentAt: new Date(),
      // });
    } catch (error) {
      console.error('Error marking notification as sent:', error);
    }
  }
} 