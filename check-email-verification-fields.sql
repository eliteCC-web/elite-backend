-- Script para verificar si los campos de verificación de email están presentes
-- Ejecutar en la base de datos PostgreSQL

-- Verificar campos en la tabla users
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('emailVerified', 'emailVerifiedAt');

-- Verificar si la tabla email_verifications existe
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'email_verifications';

-- Verificar usuarios existentes y sus campos
SELECT 
    id,
    "firstName",
    "lastName",
    email,
    "emailVerified",
    "emailVerifiedAt",
    "createdAt"
FROM users 
LIMIT 5; 