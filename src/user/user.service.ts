import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../role/entities/role.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { roleIds, password, ...userData } = createUserDto;

      // Verificar si el email ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new ConflictException(`User with email ${userData.email} already exists`);
      }

      // Crear instancia de usuario
      const user = this.userRepository.create({
        ...userData,
        password: await bcrypt.hash(password, 10)
      });

      // Asignar roles si se proporcionan
      if (roleIds && roleIds.length > 0) {
        user.roles = await this.roleRepository.findByIds(roleIds);
        
        if (!user.roles.length) {
          throw new NotFoundException('No valid roles found with the provided IDs');
        }
      }

      // Guardar el usuario
      const savedUser = await this.userRepository.save(user);
      
      // No devolver la contraseña en la respuesta
      const { password: _, ...result } = savedUser;
      return result as User;
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      relations: ['roles', 'roles.permissions', 'ownedStores']
    });
    
    // Eliminar contraseñas antes de devolver
    return users.map(user => {
      const { password, ...userData } = user;
      return userData as User;
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'ownedStores']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...result } = user;
    return result as User;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'] 
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const { roleIds, password, ...updateData } = updateUserDto;

    // Buscar el usuario existente
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['roles'] 
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Actualizar los campos básicos
    Object.assign(user, updateData);

    // Actualizar contraseña si se proporciona
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Actualizar roles si se proporcionan
    if (roleIds && roleIds.length > 0) {
      user.roles = await this.roleRepository.findByIds(roleIds);
      
      if (!user.roles.length) {
        throw new NotFoundException('No valid roles found with the provided IDs');
      }
    }

    try {
      await this.userRepository.save(user);

      const { password: _, ...result } = user;
      return result as User;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user as User);
  }

  private handleDBExceptions(error: any) {
    this.logger.error(error);
    
    if (error.code === '23505') {
      throw new ConflictException('Duplicate entry in database');
    }
    
    if (error instanceof NotFoundException || error instanceof ConflictException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Internal server error');
  }
}