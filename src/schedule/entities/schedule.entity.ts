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

  @Column()
  date: Date;

  @Column()
  startTime: string; // "08:00"

  @Column()
  endTime: string; // "17:00"

  @Column({ default: false })
  isHoliday: boolean;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}