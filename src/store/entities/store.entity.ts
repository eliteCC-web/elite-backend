// src/store/entities/store.entity.ts - ACTUALIZACIÓN para incluir relación con User
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  storeNumber: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ type: 'jsonb', nullable: true })
  schedule: any;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  floor: string;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  monthlyRent: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => User, (user) => user.ownedStores, { nullable: true })
  @JoinColumn()
  owner: User;

  @Column({ nullable: true })
  ownerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}