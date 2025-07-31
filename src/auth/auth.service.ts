import { Injectable, NotFoundException, UnauthorizedException, forwardRef, Inject, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterInternalDto } from './dto/register-internal.dto';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { UserService } from '../user/user.service';
import { EmailVerificationService } from '../email-verification/services/email-verification.service';
import { StoreService } from '../store/store.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly storeService: StoreService
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    try {
      // Buscar usuario por email con roles
      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .leftJoinAndSelect('role.permissions', 'permission')
        .where('user.email = :email', { email })
        .getOne();
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verificar que el email esté verificado
      if (!user.emailVerified) {
        throw new UnauthorizedException('Please verify your email address before logging in. Check your inbox for the verification email.');
      }

      // Verificar que el usuario esté aprobado (para usuarios internos)
      if (user.status === 'PENDING') {
        throw new UnauthorizedException('Your account is pending approval by an administrator. You will be notified when your account is approved.');
      }

      if (user.status === 'SUSPENDED') {
        throw new UnauthorizedException('Your account has been suspended. Please contact support for assistance.');
      }
      
      // Generar token JWT
      const payload = { 
        id: user.id, 
        email: user.email,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
          permissions: role.permissions?.map(permission => ({
            id: permission.id,
            name: permission.name
          }))
        }))
      };
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          emailVerified: user.emailVerified,
          roles: user.roles.map(role => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions?.map(permission => ({
              id: permission.id,
              name: permission.name
            }))
          }))
        },
        token: this.jwtService.sign(payload)
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(registerDto: RegisterDto) {
    const { roleIds, ...userData } = registerDto;
    
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Si no se especifican roles, asignar el rol CLIENTE_EXTERNO por defecto
      let userRoles: Role[] = [];
      if (roleIds && roleIds.length > 0) {
        userRoles = await this.roleRepository.findByIds(roleIds);
      } else {
        const clienteExternoRole = await this.roleRepository.findOne({ where: { name: 'CLIENTE_EXTERNO' } });
        if (clienteExternoRole) {
          userRoles = [clienteExternoRole];
        }
      }

      // Crear el usuario
      const newUser = this.userRepository.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
        roles: userRoles,
        emailVerified: false // Asegurar que el email no esté verificado inicialmente
      });

      const savedUser = await this.userRepository.save(newUser);

      // Enviar email de verificación
      try {
        await this.emailVerificationService.sendVerificationEmail(savedUser.id, savedUser.email);
        this.logger.log(`Verification email sent to ${savedUser.email}`);
      } catch (emailError) {
        this.logger.error('Error sending verification email:', emailError);
        // No fallar el registro si el email no se puede enviar
      }

      // No devolver la contraseña en la respuesta
      const { password, ...userResponse } = savedUser;

      return {
        user: userResponse,
        message: 'User registered successfully. Please check your email to verify your account.'
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error registering user:', error);
      throw new Error('Failed to register user');
    }
  }

  async bulkCreateUsers(users: RegisterDto[]) {
    const results = { created: 0, errors: [] };
    
    for (const userData of users) {
      try {
        await this.register(userData);
        results.created++;
      } catch (error) {
        results.errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    return results;
  }

  async changePassword(id: number, password: string) {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) throw new NotFoundException('User not found');

    user.password = bcrypt.hashSync(password, 10);
    return this.userRepository.save(user);
  }

  async validateUser(payload: any) {
    return this.userService.findOne(payload.id);
  }

  async getPendingRegistrations() {
    try {
      const pendingUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .where('user.status = :status', { status: 'PENDING' })
        .orderBy('user.createdAt', 'DESC')
        .getMany();

      return {
        success: true,
        data: pendingUsers.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          roleType: user.roles[0]?.name || 'UNKNOWN',
          storeInfo: user.storeInfo
        }))
      };
    } catch (error) {
      this.logger.error('Error getting pending registrations:', error);
      return {
        success: false,
        error: 'Failed to get pending registrations'
      };
    }
  }

  async getRegistrationHistory() {
    try {
      const processedUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .where('user.status IN (:...statuses)', { statuses: ['ACTIVE', 'REJECTED'] })
        .orderBy('user.updatedAt', 'DESC')
        .getMany();

      return {
        success: true,
        data: processedUsers.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          status: user.status,
          roleType: user.roles[0]?.name || 'UNKNOWN',
          storeInfo: user.storeInfo
        }))
      };
    } catch (error) {
      this.logger.error('Error getting registration history:', error);
      return {
        success: false,
        error: 'Failed to get registration history'
      };
    }
  }

  async approveRegistration(userId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (user.status !== 'PENDING') {
        return {
          success: false,
          error: 'User is not pending approval'
        };
      }

      // Cambiar estado a ACTIVE
      user.status = 'ACTIVE';
      await this.userRepository.save(user);

      // Enviar email de notificación de aprobación
      try {
        await this.emailVerificationService.sendApprovalEmail(user.email, user.firstName);
        this.logger.log(`Approval email sent to ${user.email}`);
      } catch (emailError) {
        this.logger.error('Error sending approval email:', emailError);
        // No fallar la aprobación si el email no se puede enviar
      }

      this.logger.log(`User ${user.email} approved by administrator`);

      return {
        success: true,
        message: 'User approved successfully'
      };
    } catch (error) {
      this.logger.error('Error approving registration:', error);
      return {
        success: false,
        error: 'Failed to approve registration'
      };
    }
  }

  async rejectRegistration(userId: number, reason: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (user.status !== 'PENDING') {
        return {
          success: false,
          error: 'User is not pending approval'
        };
      }

      // Cambiar estado a REJECTED
      user.status = 'REJECTED';
      await this.userRepository.save(user);

      // Enviar email de notificación de rechazo
      try {
        await this.emailVerificationService.sendRejectionEmail(user.email, user.firstName, reason);
        this.logger.log(`Rejection email sent to ${user.email}`);
      } catch (emailError) {
        this.logger.error('Error sending rejection email:', emailError);
        // No fallar el rechazo si el email no se puede enviar
      }

      this.logger.log(`User ${user.email} rejected by administrator. Reason: ${reason}`);

      return {
        success: true,
        message: 'User rejected successfully'
      };
    } catch (error) {
      this.logger.error('Error rejecting registration:', error);
      return {
        success: false,
        error: 'Failed to reject registration'
      };
    }
  }

  async testEmailConfiguration(email: string, name: string) {
    try {
      this.logger.log(`Testing email configuration for: ${email}`);
      
      // Verificar variables de entorno
      const brevoApiKey = process.env.BREVO_API;
      const frontendUrl = process.env.FRONTEND_URL;
      
      this.logger.log(`BREVO_API configured: ${!!brevoApiKey}`);
      this.logger.log(`FRONTEND_URL: ${frontendUrl || 'http://localhost:3000'}`);
      
      if (!brevoApiKey) {
        return {
          success: false,
          error: 'BREVO_API environment variable is not set',
          config: {
            brevoApiKey: !!brevoApiKey,
            frontendUrl
          }
        };
      }

      // Intentar enviar un email de prueba
      await this.emailVerificationService.sendVerificationEmail(999, email);
      
      return {
        success: true,
        message: 'Test email sent successfully',
        config: {
          brevoApiKey: !!brevoApiKey,
          frontendUrl
        }
      };
    } catch (error) {
      this.logger.error('Test email failed:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.stack
      };
    }
  }

  async registerInternal(registerInternalDto: RegisterInternalDto) {
    const { store, ...userData } = registerInternalDto;
    
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Buscar el rol correspondiente
      const role = await this.roleRepository.findOne({ 
        where: { name: userData.roleType } 
      });

      if (!role) {
        throw new Error(`Role ${userData.roleType} not found`);
      }

      // Crear el usuario con estado pendiente
      const newUser = this.userRepository.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
        roles: [role],
        emailVerified: false,
        status: 'PENDING' // Estado pendiente de aprobación
      });

      const savedUser = await this.userRepository.save(newUser);

      // Si es CLIENTE_INTERNO y tiene información de tienda, crear la tienda
      if (userData.roleType === 'CLIENTE_INTERNO' && store) {
        try {
          // Generar un número de local único basado en el nombre de la tienda
          const storeNumber = this.generateStoreNumber(store.name);
          
          // Crear la tienda usando solo los campos existentes
          const storeData = {
            storeNumber: store.address, // Usar address como storeNumber
            name: store.name,
            phone: store.phone,
            description: store.description,
            images: store.images || [],
            videos: store.videos || [],
            schedule: store.schedule,
            ownerId: savedUser.id
          };

          this.logger.log(`Creating store for user ${savedUser.email} with data:`, storeData);
          this.logger.log(`Store videos:`, store.videos);

          const createdStore = await this.storeService.create(storeData);
          
          // No necesitamos actualizar el usuario porque la relación se establece automáticamente
          // a través del ownerId en la tabla stores
          
          this.logger.log(`✅ Store created successfully for user ${savedUser.email}: ${createdStore.name} (${createdStore.storeNumber})`);
          this.logger.log(`✅ Store videos saved:`, createdStore.videos);
        } catch (storeError) {
          this.logger.error('❌ Error creating store for internal user:', storeError);
          this.logger.error('Store creation failed for user:', savedUser.email);
          this.logger.error('Store data that failed:', store);
          
          // No fallar el registro del usuario si la tienda no se puede crear
          // La tienda se puede crear manualmente después
          // Pero guardamos la información en storeInfo como respaldo
          savedUser.storeInfo = {
            name: store.name,
            description: store.description,
            address: store.address,
            phone: store.phone,
            schedule: store.schedule,
            images: store.images,
            videos: store.videos,
            error: 'Failed to create store automatically. Please create manually.'
          };
          await this.userRepository.save(savedUser);
        }
      }

      // Enviar email de verificación
      try {
        this.logger.log(`Starting email verification process for internal registration: ${savedUser.email}`);
        this.logger.log(`User ID: ${savedUser.id}, User Name: ${savedUser.firstName}`);
        
        await this.emailVerificationService.sendVerificationEmail(savedUser.id, savedUser.email);
        this.logger.log(`Verification email sent successfully to ${savedUser.email} for internal registration`);
      } catch (emailError) {
        this.logger.error('Error sending verification email for internal registration:', emailError);
        this.logger.error('Email error details:', {
          userId: savedUser.id,
          email: savedUser.email,
          error: emailError.message,
          stack: emailError.stack
        });
        // No fallar el registro si el email no se puede enviar
      }

      // No devolver la contraseña en la respuesta
      const { password, ...userResponse } = savedUser;

      return {
        user: userResponse,
        message: 'Internal registration request submitted successfully. Please check your email to verify your account. You will be notified when an administrator approves your account.'
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error registering internal user:', error);
      throw new Error('Failed to register internal user');
    }
  }

  // Método auxiliar para generar número de local único
  private generateStoreNumber(storeName: string): string {
    const timestamp = Date.now().toString().slice(-4);
    // Limpiar el nombre y tomar los primeros 3 caracteres válidos
    const cleanName = storeName.replace(/[^A-Za-z]/g, '').toUpperCase();
    const namePrefix = cleanName.length >= 3 ? cleanName.substring(0, 3) : 'STO';
    return `${namePrefix}-${timestamp}`;
  }
}