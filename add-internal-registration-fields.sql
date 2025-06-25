-- Agregar campos para registro interno a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS store_info JSONB;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users USING GIN((store_info->>'roleType'));

-- Insertar roles si no existen
INSERT INTO roles (name, description) 
VALUES 
  ('COLABORADOR', 'Colaborador interno del centro comercial'),
  ('CLIENTE_INTERNO', 'Cliente interno con local en el centro comercial')
ON CONFLICT (name) DO NOTHING;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN users.status IS 'Estado del usuario: ACTIVE, PENDING, SUSPENDED';
COMMENT ON COLUMN users.store_info IS 'Información del local para CLIENTE_INTERNO: nombre, descripción, dirección, teléfono, horarios, imágenes'; 