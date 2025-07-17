// src/schedule/entities/schedule.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.schedules)
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'date' }) // 👈 importante
  date: Date;  

  @Column()
  startTime: string; // "08:00"

  @Column()
  endTime: string; // "17:00"

  @Column({ default: false })
  isHoliday: boolean;

  @Column({ nullable: true })
  notes: string;

  @Column({ 
    type: 'enum', 
    enum: ['MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY'],
    default: 'FULL_DAY'
  })
  shiftType: string;

  @Column({ nullable: true })
  position: string; // Cargo o posición del colaborador

  @Column({ default: false })
  isAssigned: boolean; // Si el turno fue asignado automáticamente

  @Column({ nullable: true })
  assignedBy: number; // ID del admin que asignó el turno

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}