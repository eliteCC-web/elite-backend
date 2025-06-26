-- Script para limpiar URLs de imágenes que tienen comillas dobles extra
-- Ejecutar después de la migración si hay problemas con las imágenes

-- Mostrar las URLs problemáticas
SELECT 
    id,
    name,
    "imageUrl",
    CASE 
        WHEN "imageUrl" LIKE '"%"' THEN 'Tiene comillas dobles'
        WHEN "imageUrl" IS NULL THEN 'Sin imagen'
        ELSE 'OK'
    END as status
FROM stores 
WHERE "imageUrl" IS NOT NULL;

-- Limpiar URLs que tienen comillas dobles al inicio y final
UPDATE stores 
SET "imageUrl" = TRIM(BOTH '"' FROM "imageUrl")
WHERE "imageUrl" LIKE '"%"' OR "imageUrl" LIKE '%"';

-- Verificar que se limpiaron correctamente
SELECT 
    id,
    name,
    "imageUrl",
    CASE 
        WHEN "imageUrl" LIKE '"%"' THEN 'Tiene comillas dobles'
        WHEN "imageUrl" IS NULL THEN 'Sin imagen'
        ELSE 'OK'
    END as status
FROM stores 
WHERE "imageUrl" IS NOT NULL
ORDER BY id; 