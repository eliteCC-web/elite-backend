-- Migration script para agregar verificación de email
-- Ejecutar este script en la base de datos PostgreSQL

-- 1. Agregar campos de verificación de email a la tabla users (si no existen)
DO $$ 
BEGIN
    -- Agregar emailVerified si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'emailVerified') THEN
        ALTER TABLE users ADD COLUMN "emailVerified" BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Campo emailVerified agregado a la tabla users';
    ELSE
        RAISE NOTICE 'Campo emailVerified ya existe en la tabla users';
    END IF;

    -- Agregar emailVerifiedAt si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'emailVerifiedAt') THEN
        ALTER TABLE users ADD COLUMN "emailVerifiedAt" TIMESTAMP;
        RAISE NOTICE 'Campo emailVerifiedAt agregado a la tabla users';
    ELSE
        RAISE NOTICE 'Campo emailVerifiedAt ya existe en la tabla users';
    END IF;
END $$;

-- 2. Crear tabla de verificaciones de email (si no existe)
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,
    email TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Crear índices para mejorar el rendimiento (si no existen)
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications("userId");

-- 4. Marcar usuarios existentes como verificados (opcional - descomenta si quieres)
-- UPDATE users SET "emailVerified" = TRUE WHERE "emailVerified" IS NULL;

-- 5. Verificar que los cambios se aplicaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('emailVerified', 'emailVerifiedAt');

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'email_verifications';

-- 6. Mostrar algunos usuarios para verificar
SELECT 
    id,
    "firstName",
    "lastName",
    email,
    "emailVerified",
    "emailVerifiedAt"
FROM users 
LIMIT 3; 