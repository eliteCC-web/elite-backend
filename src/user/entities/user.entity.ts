// src/user/entities/user.entity.ts - ACTUALIZACIÓN para incluir relación con Store y Schedule
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, OneToOne, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { Event } from '../../event/entities/event.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';
import { Store } from '../../store/entities/store.entity';
import { EmailVerification } from '../../email-verification/entities/email-verification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  profileImage: string;

  // Campo para estado de aprobación de usuarios internos
  @Column({ default: 'ACTIVE' })
  status: string;

  // Información del store para CLIENTE_INTERNO
  @Column({ type: 'jsonb', nullable: true })
  storeInfo: any;

  // Campos para verificación de email
  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'users_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];

  @ManyToMany(() => Event, (event) => event.registeredUsers)
  registeredEvents: Event[];

  @OneToMany(() => Schedule, (schedule) => schedule.user)
  schedules: Schedule[];

  @OneToMany(() => Store, (store) => store.owner)
  ownedStores: Store[];

  // Relación con verificaciones de email
  @OneToMany(() => EmailVerification, (verification) => verification.user)
  emailVerifications: EmailVerification[];

  // Método para obtener el nombre completo
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}