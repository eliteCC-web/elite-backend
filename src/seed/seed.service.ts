import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>
  ) {}

  async onModuleInit() {
    await this.runSeed();
    this.logger.debug('Seed executed');
  }

  async runSeed() {
    await this.createPermissions();
    await this.createRoles();
    await this.createAdminUser();
  }

  private async createPermissions() {
    const permissionsToCreate = [
      { name: 'create_user', description: 'Can create users' },
      { name: 'read_user', description: 'Can read users' },
      { name: 'update_user', description: 'Can update users' },
      { name: 'delete_user', description: 'Can delete users' },
      { name: 'create_store', description: 'Can create stores' },
      { name: 'read_store', description: 'Can read stores' },
      { name: 'update_store', description: 'Can update stores' },
      { name: 'delete_store', description: 'Can delete stores' },
    ];

    for (const permissionData of permissionsToCreate) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: permissionData.name }
      });

      if (!existingPermission) {
        await this.permissionRepository.save(this.permissionRepository.create(permissionData));
        this.logger.log(`Created permission: ${permissionData.name}`);
      }
    }
  }

  private async createRoles() {
    // Definir datos de roles
    const rolesToCreate = [
      {
        name: 'ADMIN',
        description: 'Administrator with full access',
        permissions: [
          'create_user', 'read_user', 'update_user', 'delete_user',
          'create_store', 'read_store', 'update_store', 'delete_store',
        ]
      },
      {
        name: 'STORE_MANAGER',
        description: 'Store manager with limited access',
        permissions: ['read_store', 'update_store']
      },
      {
        name: 'USER',
        description: 'Regular user with minimal access',
        permissions: ['read_store']
      }
    ];

    // Crear o actualizar roles
    for (const roleData of rolesToCreate) {
      let role = await this.roleRepository.findOne({
        where: { name: roleData.name }
      });

      if (!role) {
        role = this.roleRepository.create({
          name: roleData.name,
          description: roleData.description
        });
      }

      // Buscar permisos y asignarlos al rol
      const permissions = await this.permissionRepository.find({
        where: roleData.permissions.map(name => ({ name }))
      });

      role.permissions = permissions;
      await this.roleRepository.save(role);
      this.logger.log(`Created/updated role: ${roleData.name}`);
    }
  }

  private async createAdminUser() {
    const adminEmail = 'admin@elitecc.com';
    
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const adminRole = await this.roleRepository.findOne({
        where: { name: 'ADMIN' },
        relations: ['permissions']
      });

      if (!adminRole) {
        this.logger.error('Admin role not found. Cannot create admin user.');
        return;
      }

      const adminUser = this.userRepository.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: await bcrypt.hash('Admin123', 10),
        phone: '1234567890',
        roles: [adminRole]
      });

      await this.userRepository.save(adminUser);
      this.logger.log('Admin user created successfully.');
    }
  }
}