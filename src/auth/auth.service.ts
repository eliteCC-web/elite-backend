import { Injectable, NotFoundException, UnauthorizedException, forwardRef, Inject, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { UserService } from '../user/user.service';
import { EmailVerificationService } from '../email-verification/services/email-verification.service';

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
    private readonly emailVerificationService: EmailVerificationService
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
}