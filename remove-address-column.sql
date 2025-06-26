-- Script para eliminar la columna address de la tabla stores
-- Ya que storeNumber y address son lo mismo (LOCAL XXX)

-- Eliminar la columna address
ALTER TABLE stores DROP COLUMN IF EXISTS address;

-- Verificar que la columna se eliminó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY column_name; 