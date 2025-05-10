import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      console.error('User roles not defined or invalid.');
      return false;
    }

    // Extraer solo los nombres de los roles para una mejor depuración
    const userRoleNames = user.roles.map(role => role.name);
    console.log('Roles del usuario:', userRoleNames);
    console.log('Roles requeridos:', requiredRoles);

    // Verificar si al menos uno de los nombres de rol del usuario está en los roles requeridos
    const hasPermission = user.roles.some(userRole => requiredRoles.includes(userRole.name));
    console.log('¿Usuario tiene permiso?', hasPermission);

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}