// src/role/role.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { permissionIds, ...roleData } = createRoleDto;
    
    // Verificar si el rol ya existe
    const existingRole = await this.roleRepository.findOne({ 
      where: { name: roleData.name } 
    });
    
    if (existingRole) {
      throw new BadRequestException(`Role with name ${roleData.name} already exists`);
    }
    
    // Crear instancia de rol
    const role = this.roleRepository.create(roleData);
    
    // Asignar permisos si se proporcionan
    if (permissionIds && permissionIds.length > 0) {
      role.permissions = await this.permissionRepository.findByIds(permissionIds);
      
      if (role.permissions.length !== permissionIds.length) {
        throw new NotFoundException('Some permissions were not found');
      }
    }
    
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ 
      relations: ['permissions'] 
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions']
    });
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    return role;
  }

  async findOneByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['permissions']
    });
    
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { permissionIds, ...updateData } = updateRoleDto;
    
    // Buscar el rol existente
    const role = await this.roleRepository.preload({
      id,
      ...updateData
    });
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    // Actualizar permisos si se proporcionan
    if (permissionIds && permissionIds.length > 0) {
      role.permissions = await this.permissionRepository.findByIds(permissionIds);
      
      if (role.permissions.length !== permissionIds.length) {
        throw new NotFoundException('Some permissions were not found');
      }
    }
    
    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }
}