// src/event/event.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from '../user/entities/user.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RegisterEventDto } from './dto/register-event.dto';
import { EmailNotificationService } from './services/email-notification.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { PaginationDto } from '../common/interfaces/pagination.dto';

@Injectable()
export class EventService {
  private readonly logger = new Logger('EventService');

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EventRegistration)
    private readonly eventRegistrationRepository: Repository<EventRegistration>,
    private readonly emailNotificationService: EmailNotificationService
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = this.generateSlug(name);
    let counter = 1;
    let uniqueSlug = slug;

    while (await this.eventRepository.findOne({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    try {
      // Generar slug automáticamente si no se proporciona
      const slug = createEventDto.slug || await this.generateUniqueSlug(createEventDto.name);

      // Verificar si ya existe un evento con ese slug
      const existingEvent = await this.eventRepository.findOne({
        where: { slug }
      });

      if (existingEvent) {
        throw new BadRequestException(`Event with slug ${slug} already exists`);
      }

      const event = this.eventRepository.create({
        ...createEventDto,
        slug,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
      });

      return await this.eventRepository.save(event);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto, filters?: any): Promise<PaginatedResponse<Event>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { category, featured, search } = filters || {};
      const skip = (page - 1) * limit;

      const queryBuilder = this.eventRepository.createQueryBuilder('event');

      if (category) {
        queryBuilder.andWhere('event.categories LIKE :category', { category: `%${category}%` });
      }

      if (featured !== undefined) {
        queryBuilder.andWhere('event.isFeatured = :featured', { featured });
      }

      if (search) {
        queryBuilder.andWhere(
          '(event.name LIKE :search OR event.description LIKE :search)',
          { search: `%${search}%` }
        );
      }

      queryBuilder.andWhere('event.isActive = :isActive', { isActive: true });
      queryBuilder.orderBy('event.startDate', 'ASC');
      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Obtener el conteo de registros activos
    const registeredCount = await this.eventRegistrationRepository.count({
      where: { 
        eventId: id,
        isActive: true
      }
    });

    // Asignar el conteo al evento
    event.registeredCount = registeredCount;

    return event;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { slug }
    });

    if (!event) {
      throw new NotFoundException(`Event with slug ${slug} not found`);
    }

    // Obtener el conteo de registros activos
    const registeredCount = await this.eventRegistrationRepository.count({
      where: { 
        eventId: event.id,
        isActive: true
      }
    });

    // Asignar el conteo al evento
    event.registeredCount = registeredCount;

    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    try {
      const event = await this.eventRepository.preload({
        id,
        ...updateEventDto,
        ...(updateEventDto.startDate && { startDate: new Date(updateEventDto.startDate) }),
        ...(updateEventDto.endDate && { endDate: new Date(updateEventDto.endDate) }),
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      return await this.eventRepository.save(event);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  async registerUser(registerEventDto: RegisterEventDto): Promise<Event> {
    const { eventId, phone, name, email } = registerEventDto;

    const event = await this.eventRepository.findOne({
      where: { id: eventId }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Verificar si el evento está activo
    if (!event.isActive) {
      throw new BadRequestException('Event is not active');
    }

    // Verificar si el evento ya pasó
    const now = new Date();
    const eventDate = new Date(event.startDate);
    if (eventDate < now) {
      throw new BadRequestException('Event has already passed');
    }

    // Verificar si el usuario ya está registrado por teléfono
    const existingRegistration = await this.eventRegistrationRepository.findOne({
      where: { 
        eventId,
        phone,
        isActive: true
      }
    });

    if (existingRegistration) {
      throw new BadRequestException('User is already registered for this event with this phone number');
    }

    // Verificar capacidad (solo si no es ilimitado)
    if (event.capacity > 0) {
      const registeredCount = await this.eventRegistrationRepository.count({
        where: { 
          eventId,
          isActive: true
        }
      });

      if (registeredCount >= event.capacity) {
        throw new BadRequestException('Event is at full capacity');
      }
    }

    // Generar código único de registro
    const registrationCode = this.generateRegistrationCode();

    // Crear el registro
    const registration = this.eventRegistrationRepository.create({
      eventId,
      phone,
      name,
      email,
      registrationCode,
      isActive: true
    });

    await this.eventRegistrationRepository.save(registration);

    // Enviar email de confirmación
    await this.emailNotificationService.sendEventRegistrationEmail(event, registration);

    // Retornar el evento actualizado
    return await this.findOne(eventId);
  }

  private generateRegistrationCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `EVT-${timestamp}-${random}`.toUpperCase();
  }

  async unregisterUser(eventId: number, userId: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['registeredUsers']
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Remover usuario del evento
    event.registeredUsers = event.registeredUsers.filter(u => u.id !== userId);
    event.registeredCount = event.registeredUsers.length;

    return await this.eventRepository.save(event);
  }

  async getFeatured(): Promise<Event[]> {
    return this.eventRepository.find({
      where: { isFeatured: true, isActive: true },
      order: { startDate: 'ASC' },
      take: 6
    });
  }

  async getUpcoming(): Promise<Event[]> {
    return this.eventRepository.find({
      where: { isActive: true },
      order: { startDate: 'ASC' },
      take: 10
    });
  }

  private handleDBExceptions(error: any) {
    this.logger.error(error);
    
    if (error.code === '23505') {
      throw new BadRequestException('Duplicate entry in database');
    }
    
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Internal server error');
  }
}