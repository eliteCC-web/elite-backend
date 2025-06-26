import { Injectable } from '@nestjs/common';
import { Event } from '../entities/event.entity';
import { EventRegistration } from '../entities/event-registration.entity';

@Injectable()
export class EmailNotificationService {
  async sendEventRegistrationEmail(
    event: Event,
    registration: EventRegistration
  ): Promise<void> {
    try {
      // Aquí iría la lógica real de envío de email
      // Por ahora solo simulamos el envío
      console.log('📧 Enviando email de confirmación de registro:');
      console.log(`Evento: ${event.name}`);
      console.log(`Participante: ${registration.name}`);
      console.log(`Teléfono: ${registration.phone}`);
      console.log(`Email: ${registration.email || 'No proporcionado'}`);
      console.log(`Código de registro: ${registration.registrationCode}`);
      console.log(`Fecha del evento: ${event.startDate}`);
      console.log(`Ubicación: ${event.location}`);
      console.log(`Precio: ${event.price === 0 ? 'Gratis' : `$${event.price}`}`);
      
      // En un entorno real, aquí usarías un servicio como SendGrid, AWS SES, etc.
      // await this.emailService.send({
      //   to: registration.email,
      //   subject: `Confirmación de registro - ${event.name}`,
      //   template: 'event-registration',
      //   context: {
      //     eventName: event.name,
      //     participantName: registration.name,
      //     registrationCode: registration.registrationCode,
      //     eventDate: event.startDate,
      //     eventLocation: event.location,
      //     eventPrice: event.price === 0 ? 'Gratis' : `$${event.price}`,
      //     eventDescription: event.description
      //   }
      // });
    } catch (error) {
      console.error('Error enviando email de confirmación:', error);
      // No lanzamos el error para no afectar el registro
    }
  }
} 