import { Injectable, Logger } from '@nestjs/common';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class ScheduleNotificationService {
  private readonly logger = new Logger('ScheduleNotificationService');

  async sendShiftAssignmentEmail(schedule: Schedule, user: User, assignedBy: User): Promise<void> {
    try {
      this.logger.log(`Sending shift assignment email to ${user.email}`);

      const brevo = require('@getbrevo/brevo');
      let apiInstance = new brevo.TransactionalEmailsApi();
      
      let apiKey = apiInstance.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API;
      
      let sendSmtpEmail = new brevo.SendSmtpEmail();

      const date = new Date(schedule.date);
      const formattedDate = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      sendSmtpEmail.subject = "Nuevo turno asignado - Centro Comercial Elite";
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
                <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${user.firstName}!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Se te ha asignado un nuevo turno de trabajo. Revisa los detalles a continuación:
                </p>
                
                <!-- Turno Details -->
                <div style="background-color: #f8f9fa; border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid #dc2626;">
                  <div style="text-align: left;">
                    <h3 style="color: #333; margin-bottom: 20px; font-size: 18px;">📅 Detalles del Turno</h3>
                    
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #555;">Fecha:</strong>
                      <span style="color: #333; margin-left: 10px;">${formattedDate}</span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #555;">Horario:</strong>
                      <span style="color: #333; margin-left: 10px;">${schedule.startTime} - ${schedule.endTime}</span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #555;">Tipo de Turno:</strong>
                      <span style="color: #333; margin-left: 10px;">${this.getShiftTypeLabel(schedule.shiftType)}</span>
                    </div>
                    
                    ${schedule.position ? `
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #555;">Posición:</strong>
                      <span style="color: #333; margin-left: 10px;">${schedule.position}</span>
                    </div>
                    ` : ''}
                    
                    ${schedule.notes ? `
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #555;">Notas:</strong>
                      <span style="color: #333; margin-left: 10px;">${schedule.notes}</span>
                    </div>
                    ` : ''}
                    
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                      <strong style="color: #555;">Asignado por:</strong>
                      <span style="color: #333; margin-left: 10px;">${assignedBy.firstName} ${assignedBy.lastName}</span>
                    </div>
                  </div>
                </div>
                
                <div style="margin: 40px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mi-horario" 
                     style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold; 
                            font-size: 16px; 
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
                    Ver Mi Horario
                  </a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    Si tienes alguna pregunta sobre tu turno, contacta a tu supervisor.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Centro Comercial Elite. Todos los derechos reservados.
                </p>
                <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
                  Contacto: elitecc.soporte@gmail.com
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const senderEmail = "elitecc.soporte@gmail.com";
      const replyToEmail = "elitecc.soporte@gmail.com";
      
      sendSmtpEmail.sender = { "name": "Elite", "email": senderEmail };
      sendSmtpEmail.to = [{ "email": user.email, "name": user.firstName }];
      sendSmtpEmail.replyTo = { "email": replyToEmail };

      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`Shift assignment email sent successfully to ${user.email}. Message ID: ${response.messageId}`);
    } catch (error) {
      this.logger.error('Error sending shift assignment email:', error);
      // No lanzamos el error para no afectar la asignación del turno
    }
  }

  private getShiftTypeLabel(shiftType: string): string {
    const labels = {
      'MORNING': 'Mañana (08:00 - 16:00)',
      'AFTERNOON': 'Tarde (16:00 - 00:00)',
      'NIGHT': 'Noche (00:00 - 08:00)',
      'FULL_DAY': 'Día completo (08:00 - 18:00)'
    };
    return labels[shiftType] || shiftType;
  }
} 