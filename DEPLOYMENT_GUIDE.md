# Guía de Despliegue - Sistema Elite con Email Verification

## 🚀 Preparación para Despliegue

### ✅ Cambios Realizados

1. **Roles Corregidos**: 
   - Usuarios normales ahora tienen rol `CLIENTE_EXTERNO` (no `USER`)
   - Nuevos registros se asignan automáticamente como `CLIENTE_EXTERNO`
   - Seed automática crea usuarios con roles correctos

2. **Email Verification**:
   - Sistema completo de verificación de email implementado
   - Usuarios de seed están verificados por defecto
   - Login requiere email verificado

3. **Endpoints Corregidos**:
   - `/users/profile` accesible para todos los roles
   - Controladores actualizados para usar roles correctos

### 🔧 Configuración Requerida

#### Variables de Entorno (Railway)

```env
# Brevo API Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender@yourdomain.com
BREVO_SENDER_NAME=Elite Shopping Center

# Email Verification Settings
EMAIL_VERIFICATION_EXPIRY_HOURS=24
FRONTEND_URL=https://your-frontend-url.com

# Database (Railway proporciona esto automáticamente)
DATABASE_URL=postgresql://...

# JWT Secret
JWT_SECRET=your_jwt_secret_here
```

#### Configuración de Brevo

1. Crear cuenta en [Brevo](https://www.brevo.com/)
2. Obtener API Key desde el dashboard
3. Verificar dominio de email remitente
4. Configurar plantillas de email (opcional)

## 📋 Pasos de Despliegue

### 1. Eliminar Base de Datos Actual

1. Ir a Railway Dashboard
2. Seleccionar tu proyecto
3. Ir a la pestaña "Database"
4. Hacer clic en "Delete Database"
5. Confirmar eliminación

### 2. Desplegar Backend

1. Hacer commit de todos los cambios
2. Push a tu repositorio
3. Railway detectará los cambios y desplegará automáticamente

### 3. Verificar Despliegue

Una vez desplegado, el sistema:

1. **Creará automáticamente la base de datos** con TypeORM
2. **Ejecutará la seed automática** que creará:
   - Permisos del sistema
   - Roles (ADMIN, COLABORADOR, CLIENTE_INTERNO, CLIENTE_EXTERNO)
   - Usuario admin: `admin@elitecc.com` / `Admin123`
   - 75 colaboradores: `colaborador1@elitecc.com` / `Elite123`
   - 75 clientes internos: `cliente.interno1@elitecc.com` / `Elite123`
   - 25 clientes externos: `cliente.externo1@elitecc.com` / `Elite123`

### 4. Probar Sistema

#### Usuarios de Prueba

```bash
# Admin
Email: admin@elitecc.com
Password: Admin123

# Cliente Externo (usuario normal)
Email: cliente.externo1@elitecc.com
Password: Elite123

# Colaborador
Email: colaborador1@elitecc.com
Password: Elite123

# Cliente Interno
Email: cliente.interno1@elitecc.com
Password: Elite123
```

#### Endpoints de Prueba

```bash
# Login
POST /auth/login

# Perfil (debería funcionar para todos los roles)
GET /users/profile

# Verificar email
GET /email-verification/verify/:token

# Reenviar email de verificación
POST /email-verification/send
```

## 🧪 Scripts de Prueba

### Verificar Preparación

```bash
node check-deployment-readiness.js
```

### Probar Endpoints

```bash
node test-cliente-externo-endpoint.js
```

### Verificar Base de Datos

```bash
node check-email-verification-fields.js
```

## 🔍 Verificación Post-Despliegue

### 1. Verificar Logs

En Railway Dashboard, verificar que:
- La aplicación se inició correctamente
- No hay errores de conexión a base de datos
- La seed se ejecutó correctamente

### 2. Probar Login

1. Intentar login con `cliente.externo1@elitecc.com` / `Elite123`
2. Verificar que el perfil se carga correctamente
3. Confirmar que el rol es `CLIENTE_EXTERNO`

### 3. Probar Registro

1. Registrar un nuevo usuario
2. Verificar que se asigna rol `CLIENTE_EXTERNO`
3. Verificar que se envía email de verificación
4. Verificar email y hacer login

## 🚨 Solución de Problemas

### Error: "You do not have permission to access this resource"

**Causa**: Usuario tiene rol incorrecto
**Solución**: Verificar que el usuario tiene rol `CLIENTE_EXTERNO`

### Error: "Please verify your email address before logging in"

**Causa**: Email no verificado
**Solución**: 
1. Verificar email en bandeja de entrada
2. Usar función de reenvío
3. Verificar configuración de Brevo

### Error: "Invalid credentials"

**Causa**: Credenciales incorrectas
**Solución**: Usar usuarios de prueba de la seed

### Error: "Database connection failed"

**Causa**: Base de datos no creada
**Solución**: 
1. Verificar que se eliminó la base de datos anterior
2. Esperar a que Railway cree la nueva base de datos
3. Verificar variables de entorno

## 📊 Estructura Final

### Roles del Sistema

- **ADMIN**: 1 usuario (admin@elitecc.com)
- **COLABORADOR**: 75 usuarios (colaborador1-75@elitecc.com)
- **CLIENTE_INTERNO**: 75 usuarios (cliente.interno1-75@elitecc.com)
- **CLIENTE_EXTERNO**: 25 usuarios (cliente.externo1-25@elitecc.com)

### Permisos por Rol

- **ADMIN**: Acceso completo
- **COLABORADOR**: Gestión de eventos, lectura de usuarios y tiendas
- **CLIENTE_INTERNO**: Gestión de su tienda, lectura de eventos
- **CLIENTE_EXTERNO**: Lectura de tiendas y eventos (usuario normal)

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en Railway
- [ ] Base de datos eliminada
- [ ] Backend desplegado
- [ ] Seed ejecutada automáticamente
- [ ] Login funciona con usuarios de prueba
- [ ] Perfil se carga correctamente
- [ ] Email verification funciona
- [ ] Nuevos registros asignan rol correcto

## 🎯 Resultado Esperado

Después del despliegue, tendrás un sistema completamente funcional donde:

1. **Los usuarios normales** tienen rol `CLIENTE_EXTERNO`
2. **El perfil se carga** sin errores de permisos
3. **La verificación de email** funciona correctamente
4. **Los nuevos registros** se asignan automáticamente al rol correcto
5. **La seed automática** proporciona datos de prueba útiles

¡El sistema está listo para producción! 🚀 