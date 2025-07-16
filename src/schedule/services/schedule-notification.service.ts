import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class ScheduleNotificationService {
  private readonly logger = new Logger(ScheduleNotificationService.name);

  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendScheduleNotification(scheduleId: number): Promise<void> {
    try {
      this.logger.log(`Starting to send notification for schedule ID: ${scheduleId}`);
      
      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['user'],
      });

      if (!schedule) {
        this.logger.warn(`Schedule with ID ${scheduleId} not found`);
        return;
      }

      this.logger.log(`Found schedule for user: ${schedule.user?.firstName} ${schedule.user?.lastName}`);
      this.logger.log(`Schedule details - Date: ${schedule.date}, Start: ${schedule.startTime}, End: ${schedule.endTime}, Type: ${schedule.shiftType}`);

      if (!schedule.user?.email) {
        this.logger.warn(`User ${schedule.user?.firstName} ${schedule.user?.lastName} has no email`);
        return;
      }

      this.logger.log(`User email found: ${schedule.user.email}`);
      this.logger.log(`User ID: ${schedule.user.id}`);
      this.logger.log(`User roles: ${schedule.user.roles?.map(r => r.name).join(', ') || 'No roles'}`);
      this.logger.log(`BREVO_API configured: ${process.env.BREVO_API ? 'YES' : 'NO'}`);

      await this.sendEmailNotification(schedule);
      await this.markNotificationAsSent(scheduleId);
      
      this.logger.log(`Notification sent successfully for schedule ID: ${scheduleId}`);
      
    } catch (error) {
      this.logger.error('Error sending schedule notification:', error);
      this.logger.error('Error details:', error.message);
      if (error.stack) {
        this.logger.error('Error stack:', error.stack);
      }
    }
  }

  async sendBulkScheduleNotifications(scheduleIds: number[]): Promise<void> {
    try {
      this.logger.log(`Sending bulk notifications for ${scheduleIds.length} schedules`);
      
      for (const scheduleId of scheduleIds) {
        await this.sendScheduleNotification(scheduleId);
        // Pequeña pausa para no sobrecargar el servicio de email
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.logger.log(`Bulk notifications completed for ${scheduleIds.length} schedules`);
    } catch (error) {
      this.logger.error('Error sending bulk schedule notifications:', error);
    }
  }

  async sendScheduleReminder(scheduleId: number): Promise<void> {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['user'],
      });

      if (!schedule) {
        this.logger.warn(`Schedule with ID ${scheduleId} not found for reminder`);
        return;
      }

      if (!schedule.user?.email) {
        this.logger.warn(`User ${schedule.user?.firstName} ${schedule.user?.lastName} has no email for reminder`);
        return;
      }

      await this.sendReminderEmail(schedule);
      
    } catch (error) {
      this.logger.error('Error sending schedule reminder:', error);
    }
  }

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
      this.logger.error('Error getting user pending notifications:', error);
      return [];
    }
  }

  async markNotificationAsSent(scheduleId: number): Promise<void> {
    try {
      this.logger.log(`Notification marked as sent for schedule ${scheduleId}`);
      
      // En el futuro se pueden agregar campos a la entidad Schedule
      // await this.scheduleRepository.update(scheduleId, {
      //   notificationSent: true,
      //   notificationSentAt: new Date(),
      // });
    } catch (error) {
      this.logger.error('Error marking notification as sent:', error);
    }
  }

  private async sendEmailNotification(schedule: Schedule): Promise<void> {
    try {
      this.logger.log(`Starting email notification for schedule ID: ${schedule.id}`);
      this.logger.log(`BREVO_API key length: ${process.env.BREVO_API?.length || 0}`);
      
      const brevo = require('@getbrevo/brevo');
      let apiInstance = new brevo.TransactionalEmailsApi();
      
      let apiKey = apiInstance.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API;
      
      this.logger.log(`Brevo API instance created successfully`);
      
      let sendSmtpEmail = new brevo.SendSmtpEmail();

      const formattedDate = new Date(schedule.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const shiftTypeText = this.getShiftTypeText(schedule.shiftType);

      sendSmtpEmail.subject = `Nuevo turno asignado - ${formattedDate}`;
      sendSmtpEmail.htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">ELITE</h1>
                <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Centro Comercial Elite</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 20px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">¡Hola, ${schedule.user?.firstName}!</h2>
                
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
                  <h3 style="color: #dc2626; margin-bottom: 15px;">Nuevo Turno Asignado</h3>
                  
                  <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Fecha:</strong>
                      <span style="color: #666; margin-left: 10px;">${formattedDate}</span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Horario:</strong>
                      <span style="color: #666; margin-left: 10px;">${schedule.startTime} - ${schedule.endTime}</span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Tipo de Turno:</strong>
                      <span style="color: #666; margin-left: 10px;">${shiftTypeText}</span>
                    </div>
                    
                    ${schedule.position ? `
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Posición:</strong>
                      <span style="color: #666; margin-left: 10px;">${schedule.position}</span>
                    </div>
                    ` : ''}
                    
                    ${schedule.notes ? `
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Notas:</strong>
                      <span style="color: #666; margin-left: 10px;">${schedule.notes}</span>
                    </div>
                    ` : ''}
                  </div>
                </div>
                
                <div style="background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">¡Gracias por tu dedicación al equipo de Elite!</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  Si tienes alguna pregunta sobre tu turno, no dudes en contactar a tu supervisor.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
                  © 2024 Centro Comercial Elite. Todos los derechos reservados.
                </p>
                <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
                  Contacto: elitecc.soporte@gmail.com
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Configurar el remitente
      const senderEmail = "elitecc.soporte@gmail.com";
      const replyToEmail = "elitecc.soporte@gmail.com";
      
      sendSmtpEmail.sender = { "name": "Elite Centro Comercial", "email": senderEmail };
      sendSmtpEmail.to = [{ "email": schedule.user.email, "name": `${schedule.user.firstName} ${schedule.user.lastName}` }];
      sendSmtpEmail.replyTo = { "email": replyToEmail };

      this.logger.log(`=== EMAIL CONFIGURATION ===`);
      this.logger.log(`Sender: ${senderEmail}`);
      this.logger.log(`Recipient: ${schedule.user.email} (${schedule.user.firstName} ${schedule.user.lastName})`);
      this.logger.log(`Subject: ${sendSmtpEmail.subject}`);
      this.logger.log(`Content length: ${sendSmtpEmail.htmlContent?.length || 0} characters`);
      this.logger.log(`=== END EMAIL CONFIGURATION ===`);

      this.logger.log(`Sending schedule notification email to ${schedule.user.email}`);
      
      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      
      this.logger.log(`Schedule notification email sent successfully to ${schedule.user.email}`);
      this.logger.log(`Message ID: ${response.messageId || response.body?.messageId}`);
      
    } catch (error) {
      this.logger.error('Error sending schedule notification email:', error);
      throw error;
    }
  }

  private async sendReminderEmail(schedule: Schedule): Promise<void> {
    try {
      const brevo = require('@getbrevo/brevo');
      let apiInstance = new brevo.TransactionalEmailsApi();
      
      let apiKey = apiInstance.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API;
      
      let sendSmtpEmail = new brevo.SendSmtpEmail();

      const formattedDate = new Date(schedule.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const shiftTypeText = this.getShiftTypeText(schedule.shiftType);

      sendSmtpEmail.subject = `Recordatorio de turno - ${formattedDate}`;
      sendSmtpEmail.htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">ELITE</h1>
                <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Centro Comercial Elite</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 20px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">¡Hola, ${schedule.user?.firstName}!</h2>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 30px; margin: 20px 0;">
                  <h3 style="color: #856404; margin-bottom: 15px;">Recordatorio de Turno</h3>
                  
                  <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Fecha:</strong>
                      <span style="color: #666; margin-left: 10px;">${formattedDate}</span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Horario:</strong>
                      <span style="color: #666; margin-left: 10px;">${schedule.startTime} - ${schedule.endTime}</span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #333;">Tipo de Turno:</strong>
                      <span style="color: #666; margin-left: 10px;">${shiftTypeText}</span>
                    </div>
                  </div>
                </div>
                
                <div style="background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">¡No olvides tu turno mañana!</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  Si tienes algún problema para asistir, contacta a tu supervisor lo antes posible.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
                  © 2024 Centro Comercial Elite. Todos los derechos reservados.
                </p>
                <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
                  Contacto: elitecc.soporte@gmail.com
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Configurar el remitente
      const senderEmail = "elitecc.soporte@gmail.com";
      const replyToEmail = "elitecc.soporte@gmail.com";
      
      sendSmtpEmail.sender = { "name": "Elite Centro Comercial", "email": senderEmail };
      sendSmtpEmail.to = [{ "email": schedule.user.email, "name": `${schedule.user.firstName} ${schedule.user.lastName}` }];
      sendSmtpEmail.replyTo = { "email": replyToEmail };

      this.logger.log(`Sending schedule reminder email to ${schedule.user.email}`);
      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      
      this.logger.log(`Schedule reminder email sent successfully to ${schedule.user.email}`);
      this.logger.log(`Message ID: ${response.messageId || response.body?.messageId}`);
      
    } catch (error) {
      this.logger.error('Error sending schedule reminder email:', error);
      throw error;
    }
  }

  private getShiftTypeText(shiftType: string): string {
    switch (shiftType) {
      case 'MORNING':
        return 'Turno de Mañana';
      case 'AFTERNOON':
        return 'Turno de Tarde';
      case 'NIGHT':
        return 'Turno de Noche';
      case 'FULL_DAY':
        return 'Turno Completo';
      default:
        return 'Turno';
    }
  }
} 