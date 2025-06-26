-- Script para cambiar imageUrl por images (array de imágenes)
-- Ejecutar antes de la migración

-- Agregar columna images
ALTER TABLE stores ADD COLUMN IF NOT EXISTS images JSONB;

-- Migrar datos de imageUrl a images (si existe)
UPDATE stores 
SET images = CASE 
    WHEN "imageUrl" IS NOT NULL AND "imageUrl" != '' 
    THEN jsonb_build_array("imageUrl")
    ELSE NULL
END
WHERE "imageUrl" IS NOT NULL;

-- Eliminar columna imageUrl
ALTER TABLE stores DROP COLUMN IF EXISTS "imageUrl";

-- Verificar que las columnas se actualizaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name IN ('images', 'schedule')
ORDER BY column_name; 