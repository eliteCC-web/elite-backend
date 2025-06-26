import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity('event_registrations')
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column()
  phone: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ unique: true })
  registrationCode: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Event, event => event.eventRegistrations)
  @JoinColumn({ name: 'eventId' })
  event: Event;
} 