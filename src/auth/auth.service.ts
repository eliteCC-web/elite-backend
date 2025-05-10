import { Injectable, NotFoundException, UnauthorizedException, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
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