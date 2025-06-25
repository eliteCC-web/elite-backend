import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerification } from '../entities/email-verification.entity';
import { User } from '../../user/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger('EmailVerificationService');

  constructor(
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendVerificationEmail(userId: number, email: string): Promise<void> {
    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException(`User with ID ${userId} not found`);
      }

      // Generar token único
      const token = crypto.randomBytes(32).toString('hex');
      
      // Crear registro de verificación con expiración de 24 horas
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Eliminar verificaciones anteriores para este usuario
      await this.emailVerificationRepository.delete({ user: { id: userId } });

      const verification = this.emailVerificationRepository.create({
        token,
        email,
        expiresAt,
        user,
      });

      await this.emailVerificationRepository.save(verification);

      // Enviar email usando Brevo
      await this.sendEmailWithBrevo(email, token, user.firstName);

    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const verification = await this.emailVerificationRepository.findOne({
        where: { token },
        relations: ['user'],
      });

      if (!verification) {
        return { success: false, message: 'Token de verificación inválido' };
      }

      // Verificar si el token ha expirado
      if (new Date() > verification.expiresAt) {
        await this.emailVerificationRepository.remove(verification);
        return { success: false, message: 'El token de verificación ha expirado' };
      }

      // Marcar email como verificado
      verification.verified = true;
      await this.emailVerificationRepository.save(verification);

      // Actualizar el usuario para marcar el email como verificado
      await this.userRepository.update(
        { id: verification.user.id },
        { emailVerified: true, emailVerifiedAt: new Date() }
      );

      return { success: true, message: 'Email verificado exitosamente' };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado con ese email');
      }

      if (user.emailVerified) {
        throw new BadRequestException('El email ya está verificado');
      }

      await this.sendVerificationEmail(user.id, email);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      this.logger.error('Error getting user by email:', error);
      return null;
    }
  }

  private async sendEmailWithBrevo(email: string, token: string, userName: string): Promise<void> {
    try {
      // Validar que la API key esté configurada
      if (!process.env.BREVO_API) {
        this.logger.error('BREVO_API environment variable is not set');
        throw new InternalServerErrorException('Configuración de email no válida');
      }

      this.logger.log(`Attempting to send email to ${email} with Brevo API`);
      this.logger.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      
      const brevo = require('@getbrevo/brevo');
      let apiInstance = new brevo.TransactionalEmailsApi();
      
      let apiKey = apiInstance.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API;
      
      let sendSmtpEmail = new brevo.SendSmtpEmail();

      sendSmtpEmail.subject = "Verifica tu cuenta en Elite";
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
                <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${userName}!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Gracias por registrarte en Elite. Para completar tu registro y activar tu cuenta, 
                  necesitas verificar tu dirección de correo electrónico.
                </p>
                
                <div style="margin: 40px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}" 
                     style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold; 
                            font-size: 16px; 
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
                    Verificar mi Email
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                  Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                </p>
                <p style="color: #dc2626; font-size: 12px; word-break: break-all; margin: 10px 0;">
                  ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}
                </p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    Este enlace expirará en 24 horas por seguridad.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Centro Comercial Elite. Todos los derechos reservados.
                </p>
                <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
                  Si no creaste esta cuenta, puedes ignorar este email.
                </p>
                <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
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
      
      this.logger.log(`Sender email: ${senderEmail}`);
      this.logger.log(`Reply to email: ${replyToEmail}`);
      this.logger.log(`Recipient email: ${email}`);
      this.logger.log(`Recipient name: ${userName}`);

      sendSmtpEmail.sender = { "name": "Elite", "email": senderEmail };
      sendSmtpEmail.to = [{ "email": email, "name": userName }];
      sendSmtpEmail.replyTo = { "email": replyToEmail };

      this.logger.log(`Sending email with Brevo API to ${email}`);
      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      
      this.logger.log(`Brevo API response: ${JSON.stringify(response)}`);
      this.logger.log(`Message ID: ${response.messageId || response.body?.messageId}`);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending verification email:', error);
      
      // Log more detailed error information
      if (error.response) {
        this.logger.error('Brevo API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      if (error.message) {
        this.logger.error('Error message:', error.message);
      }
      
      if (error.code) {
        this.logger.error('Error code:', error.code);
      }
      
      throw new InternalServerErrorException('Error al enviar email de verificación');
    }
  }

  async sendApprovalEmail(email: string, userName: string): Promise<void> {
    try {
      this.logger.log(`Sending approval email to ${email}`);
      
      const brevo = require('@getbrevo/brevo');
      let apiInstance = new brevo.TransactionalEmailsApi();
      
      let apiKey = apiInstance.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API;
      
      let sendSmtpEmail = new brevo.SendSmtpEmail();

      sendSmtpEmail.subject = "¡Tu cuenta ha sido aprobada en Elite!";
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
                <h2 style="color: #333; margin-bottom: 20px;">¡Felicitaciones, ${userName}!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Tu solicitud de registro ha sido <strong>aprobada</strong> por nuestro equipo administrativo.
                </p>
                
                <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #166534; margin: 0 0 10px 0;">✅ Cuenta Aprobada</h3>
                  <p style="color: #166534; margin: 0;">
                    Ya puedes acceder a tu cuenta y disfrutar de todos los servicios de Elite.
                  </p>
                </div>
                
                <div style="margin: 40px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                     style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold; 
                            font-size: 16px; 
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
                    Iniciar Sesión
                  </a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    Si tienes alguna pregunta, no dudes en contactarnos.
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
      sendSmtpEmail.to = [{ "email": email, "name": userName }];
      sendSmtpEmail.replyTo = { "email": replyToEmail };

      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`Approval email sent successfully to ${email}. Message ID: ${response.messageId}`);
    } catch (error) {
      this.logger.error('Error sending approval email:', error);
      throw new Error('Failed to send approval email');
    }
  }

  async sendRejectionEmail(email: string, userName: string, reason: string): Promise<void> {
    try {
      this.logger.log(`Sending rejection email to ${email}`);
      
      const brevo = require('@getbrevo/brevo');
      let apiInstance = new brevo.TransactionalEmailsApi();
      
      let apiKey = apiInstance.authentications['apiKey'];
      apiKey.apiKey = process.env.BREVO_API;
      
      let sendSmtpEmail = new brevo.SendSmtpEmail();

      sendSmtpEmail.subject = "Actualización sobre tu solicitud de registro en Elite";
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
                <h2 style="color: #333; margin-bottom: 20px;">Hola ${userName}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Hemos revisado tu solicitud de registro y lamentamos informarte que no ha sido aprobada en esta ocasión.
                </p>
                
                <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #991b1b; margin: 0 0 10px 0;">❌ Solicitud No Aprobada</h3>
                  <p style="color: #991b1b; margin: 0 0 15px 0;"><strong>Razón:</strong></p>
                  <p style="color: #991b1b; margin: 0; font-style: italic;">${reason}</p>
                </div>
                
                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">💡 ¿Qué puedes hacer?</h3>
                  <ul style="color: #0c4a6e; text-align: left; margin: 0; padding-left: 20px;">
                    <li>Revisar la información proporcionada</li>
                    <li>Corregir cualquier error identificado</li>
                    <li>Enviar una nueva solicitud si es necesario</li>
                    <li>Contactarnos para más información</li>
                  </ul>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    Si tienes preguntas sobre esta decisión, puedes contactarnos directamente.
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
      sendSmtpEmail.to = [{ "email": email, "name": userName }];
      sendSmtpEmail.replyTo = { "email": replyToEmail };

      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`Rejection email sent successfully to ${email}. Message ID: ${response.messageId}`);
    } catch (error) {
      this.logger.error('Error sending rejection email:', error);
      throw new Error('Failed to send rejection email');
    }
  }

  private handleDBErrors(error: any) {
    this.logger.error(error);
    
    if (error.status === 400) {
      throw new BadRequestException(error.response.message);
    }

    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error.code === '23505') {
      throw new BadRequestException('Duplicate entry: ' + error.detail);
    }

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
} 