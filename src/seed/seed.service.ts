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
    await this.createBulkUsers();
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
      { name: 'create_event', description: 'Can create events' },
      { name: 'read_event', description: 'Can read events' },
      { name: 'update_event', description: 'Can update events' },
      { name: 'delete_event', description: 'Can delete events' },
      { name: 'view_dashboard', description: 'Can view admin dashboard' },
      { name: 'manage_settings', description: 'Can manage system settings' },
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
          'create_event', 'read_event', 'update_event', 'delete_event',
          'view_dashboard', 'manage_settings'
        ]
      },
      {
        name: 'COLABORADOR',
        description: 'Shopping center employee with moderate access',
        permissions: [
          'read_user', 'read_store', 'update_store',
          'create_event', 'read_event', 'update_event',
          'view_dashboard'
        ]
      },
      {
        name: 'CLIENTE_INTERNO',
        description: 'Internal customer (store owner/manager)',
        permissions: [
          'read_store', 'update_store', 'read_event'
        ]
      },
      {
        name: 'CLIENTE_EXTERNO',
        description: 'External customer (visitor)',
        permissions: ['read_store', 'read_event']
      },
      {
        name: 'USER',
        description: 'Regular user with minimal access',
        permissions: ['read_store', 'read_event']
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

  private async createBulkUsers() {
    // Obtener los roles necesarios
    const colaboradorRole = await this.roleRepository.findOne({ where: { name: 'COLABORADOR' } });
    const clienteInternoRole = await this.roleRepository.findOne({ where: { name: 'CLIENTE_INTERNO' } });
    const clienteExternoRole = await this.roleRepository.findOne({ where: { name: 'CLIENTE_EXTERNO' } });

    if (!colaboradorRole || !clienteInternoRole || !clienteExternoRole) {
      this.logger.error('Some required roles not found. Cannot create bulk users.');
      return;
    }

    // Crear 75 colaboradores
    await this.createUsersWithRole('colaborador', colaboradorRole, 75);
    
    // Crear 75 clientes internos
    await this.createUsersWithRole('cliente.interno', clienteInternoRole, 75);
    
    // Crear algunos clientes externos como ejemplo
    await this.createUsersWithRole('cliente.externo', clienteExternoRole, 25);

    this.logger.log('Bulk users creation completed.');
  }

  private async createUsersWithRole(userType: string, role: Role, count: number) {
    const users = [];
    
    for (let i = 1; i <= count; i++) {
      const email = `${userType}${i}@elitecc.com`;
      
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });

      if (!existingUser) {
        const user = this.userRepository.create({
          firstName: this.getFirstName(userType, i),
          lastName: this.getLastName(userType, i),
          email: email,
          password: await bcrypt.hash('Elite123', 10),
          phone: this.generatePhone(i),
          roles: [role]
        });

        users.push(user);
      }
    }

    if (users.length > 0) {
      await this.userRepository.save(users);
      this.logger.log(`Created ${users.length} users with role: ${role.name}`);
    }
  }

  private getFirstName(userType: string, index: number): string {
    const firstNames = [
      'Ana', 'Carlos', 'María', 'José', 'Laura', 'Diego', 'Sofía', 'Miguel',
      'Carmen', 'David', 'Isabel', 'Roberto', 'Lucía', 'Andrés', 'Patricia',
      'Fernando', 'Elena', 'Ricardo', 'Mónica', 'Alejandro', 'Natalia', 'Javier',
      'Paola', 'Manuel', 'Sandra', 'Sergio', 'Adriana', 'Francisco', 'Valeria',
      'Héctor', 'Camila', 'Raúl', 'Daniela', 'Óscar', 'Andrea', 'Arturo',
      'Cristina', 'Guillermo', 'Beatriz', 'Emilio', 'Verónica', 'Ramón',
      'Claudia', 'Enrique', 'Gloria', 'Ignacio', 'Rosa', 'Joaquín', 'Pilar'
    ];
    
    const nameIndex = (index - 1) % firstNames.length;
    return firstNames[nameIndex];
  }

  private getLastName(userType: string, index: number): string {
    const lastNames = [
      'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez',
      'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández',
      'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
      'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
      'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales', 'Ortega', 'Delgado',
      'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Medina',
      'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano'
    ];
    
    const surnameIndex = (index - 1) % lastNames.length;
    return lastNames[surnameIndex];
  }

  private generatePhone(index: number): string {
    // Generar números de teléfono que empiecen con 300, 301, 302, etc.
    const prefix = 300 + (index % 10);
    const suffix = String(1000000 + index).substring(1); // 7 dígitos
    return `${prefix}${suffix}`;
  }
}