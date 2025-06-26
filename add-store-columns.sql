-- Script para agregar las columnas address y schedule a la tabla stores
-- Ejecutar este script antes de ejecutar migrate-store-info.sql

-- Agregar columna address
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- Agregar columna schedule como JSONB
ALTER TABLE stores ADD COLUMN IF NOT EXISTS schedule JSONB;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name IN ('address', 'schedule')
ORDER BY column_name; 