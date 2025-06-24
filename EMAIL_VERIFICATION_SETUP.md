# Configuración de Verificación de Email - Elite

Este documento describe cómo configurar y usar el sistema de verificación de email en el proyecto Elite.

## Configuración Requerida

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Brevo API Configuration
BREVO_API=tu_api_key_de_brevo
FRONTEND_URL=http://localhost:3000

# Email Configuration
BREVO_SENDER_EMAIL=elitecc.soporte@gmail.com
BREVO_REPLY_TO_EMAIL=elitecc.soporte@gmail.com
```

### 2. Configuración de Brevo

1. Ve a [Brevo](https://www.brevo.com/) y crea una cuenta
2. Obtén tu API key desde el dashboard
3. Verifica el email `elitecc.soporte@gmail.com` en tu cuenta de Brevo
4. Configura el dominio si es necesario

### 3. Base de Datos

Ejecuta el script de migración para agregar las tablas necesarias:

```bash
# Conecta a tu base de datos PostgreSQL y ejecuta:
psql -d tu_base_de_datos -f migration-add-email-verification.sql
```

O ejecuta las consultas manualmente:

```sql
-- Agregar campos a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP;

-- Crear tabla de verificaciones
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,
    email TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications("userId");
```

## Funcionalidades Implementadas

### Backend

1. **Entidad EmailVerification**: Almacena los tokens de verificación
2. **EmailVerificationService**: Maneja el envío y verificación de emails
3. **EmailVerificationController**: Endpoints para la API
4. **Integración con AuthService**: Verificación automática en login y registro

### Frontend

1. **Página de verificación**: `/auth/verify-email?token=...`
2. **Servicio de verificación**: `EmailVerificationService`
3. **Integración en login**: Botón para reenviar verificación
4. **Mensajes informativos**: En registro y login

## Endpoints de la API

### POST /email-verification/send
Envía un email de verificación a un usuario.

```json
{
  "userId": 1,
  "email": "usuario@ejemplo.com"
}
```

### POST /email-verification/verify
Verifica un token de email.

```json
{
  "token": "token_de_verificacion"
}
```

### POST /email-verification/resend
Reenvía un email de verificación.

```json
{
  "email": "usuario@ejemplo.com"
}
```

### GET /email-verification/status/:email
Obtiene el estado de verificación de un email.

## Flujo de Usuario

1. **Registro**: El usuario se registra y recibe automáticamente un email de verificación
2. **Verificación**: El usuario hace clic en el enlace del email
3. **Login**: Solo usuarios verificados pueden iniciar sesión
4. **Reenvío**: Si el email expira, el usuario puede solicitar uno nuevo

## Personalización del Email

El template del email se encuentra en `EmailVerificationService.sendEmailWithBrevo()`.

Características del email:
- Diseño responsivo
- Colores del tema Elite (rojo)
- Información de contacto
- Enlace de verificación
- Expiración de 24 horas

## Troubleshooting

### Error: "BREVO_API environment variable is not set"
- Verifica que la variable `BREVO_API` esté configurada en tu `.env`

### Error: "Configuración de email no válida"
- Asegúrate de que el email `elitecc.soporte@gmail.com` esté verificado en Brevo

### Error: "Token de verificación inválido"
- El token puede haber expirado (24 horas)
- El usuario puede solicitar un nuevo token

### Error: "User not found"
- Verifica que el email exista en la base de datos

## Notas Importantes

1. **Seguridad**: Los tokens expiran en 24 horas por seguridad
2. **Rate Limiting**: Considera implementar rate limiting para evitar spam
3. **Logs**: Los errores se registran en los logs del servidor
4. **Fallback**: Si el email no se puede enviar, el registro no falla

## Próximos Pasos

1. Implementar rate limiting para los endpoints de email
2. Agregar notificaciones push para recordar verificación
3. Implementar verificación de email en el perfil de usuario
4. Agregar estadísticas de verificación de email

# Sistema de Verificación de Email - Elite Backend

## Configuración Inicial

### 1. Variables de Entorno

Agregar las siguientes variables al archivo `.env`:

```env
# Brevo API Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender@yourdomain.com
BREVO_SENDER_NAME=Elite Shopping Center

# Email Verification Settings
EMAIL_VERIFICATION_EXPIRY_HOURS=24
FRONTEND_URL=http://localhost:3001
```

### 2. Configuración de Brevo

1. Crear cuenta en [Brevo](https://www.brevo.com/)
2. Obtener API Key desde el dashboard
3. Verificar dominio de email remitente
4. Configurar plantillas de email (opcional)

### 3. Instalación de Dependencias

```bash
npm install @getbrevo/brevo
```

## Migración de Base de Datos

### 1. Ejecutar Migración de Email Verification

```sql
-- Ejecutar el archivo: migration-add-email-verification.sql
```

### 2. Migración de Roles (IMPORTANTE)

**Problema identificado**: Los usuarios normales tenían rol "USER" pero deberían tener rol "CLIENTE_EXTERNO".

**Solución**: Ejecutar el script de migración de roles:

```bash
# Ejecutar en PostgreSQL
psql -d your_database_name -f migrate-user-roles.sql
```

**O ejecutar manualmente**:

```sql
-- Actualizar usuarios con rol USER a CLIENTE_EXTERNO
UPDATE users_roles 
SET role_id = (SELECT id FROM roles WHERE name = 'CLIENTE_EXTERNO')
WHERE role_id = (SELECT id FROM roles WHERE name = 'USER');
```

### 3. Verificar Migración

```bash
# Ejecutar script de verificación
node test-cliente-externo-endpoint.js
```

## Estructura de Roles

El sistema ahora maneja correctamente estos roles:

- **ADMIN**: Administrador con acceso completo
- **COLABORADOR**: Empleado del centro comercial
- **CLIENTE_INTERNO**: Cliente interno (dueño/gerente de tienda)
- **CLIENTE_EXTERNO**: Cliente externo (visitante del CC) ← **Rol por defecto para usuarios normales**
- **USER**: Rol obsoleto (no se usa más)

## API Endpoints

### Autenticación

- `POST /auth/login` - Login con verificación de email
- `POST /auth/register` - Registro con envío automático de email de verificación

### Verificación de Email

- `POST /email-verification/send` - Reenviar email de verificación
- `GET /email-verification/verify/:token` - Verificar token de email
- `DELETE /email-verification/:id` - Eliminar verificación (admin)

### Usuario

- `GET /users/profile` - Obtener perfil del usuario autenticado (sin restricciones de rol)

## Flujo de Verificación

1. **Registro**: Usuario se registra → Se asigna rol CLIENTE_EXTERNO → Se envía email de verificación
2. **Verificación**: Usuario hace clic en el enlace → Email se marca como verificado
3. **Login**: Solo usuarios con email verificado pueden hacer login
4. **Reenvío**: Usuario puede solicitar reenvío del email de verificación

## Configuración del Frontend

### Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Servicios

- `EmailVerificationService` - Manejo de verificación de email
- `AuthService` - Autenticación con manejo de estados de verificación
- `ProfileService` - Perfil de usuario usando nuevo endpoint

## Solución de Problemas

### Error: "You do not have permission to access this resource"

**Causa**: Usuario tiene rol "USER" en lugar de "CLIENTE_EXTERNO"

**Solución**: Ejecutar migración de roles:

```sql
UPDATE users_roles 
SET role_id = (SELECT id FROM roles WHERE name = 'CLIENTE_EXTERNO')
WHERE role_id = (SELECT id FROM roles WHERE name = 'USER');
```

### Error: "Please verify your email address before logging in"

**Causa**: Email no verificado

**Solución**: 
1. Verificar email en la bandeja de entrada
2. Usar función de reenvío en la página de login
3. Verificar configuración de Brevo

### Error: "Invalid credentials"

**Causa**: Email o contraseña incorrectos

**Solución**: Verificar credenciales o usar función de recuperación

## Testing

### Scripts de Prueba

```bash
# Probar endpoint de perfil para CLIENTE_EXTERNO
node test-cliente-externo-endpoint.js

# Verificar estructura de base de datos
node check-email-verification-fields.js
```

### Verificación Manual

1. Registrar nuevo usuario
2. Verificar que se asigna rol CLIENTE_EXTERNO
3. Verificar que se envía email de verificación
4. Verificar email y hacer login
5. Acceder a perfil sin errores

## Notas Importantes

- **Rol por defecto**: Los nuevos usuarios se asignan automáticamente como CLIENTE_EXTERNO
- **Migración necesaria**: Usuarios existentes con rol USER deben migrarse a CLIENTE_EXTERNO
- **Verificación obligatoria**: No se puede hacer login sin verificar email
- **Reenvío disponible**: Los usuarios pueden solicitar reenvío del email de verificación 