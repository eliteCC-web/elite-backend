-- Script de migración para mover datos de storeInfo a la tabla stores
-- Ejecutar este script en pgAdmin, psql o desde un cliente SQL conectado a Railway

-- 1. Verificar que las tablas existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
        RAISE EXCEPTION 'La tabla stores no existe';
    END IF;
END $$;

-- 2. Crear función para generar número de local único
CREATE OR REPLACE FUNCTION generate_store_number(store_name TEXT)
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    name_prefix TEXT;
    clean_name TEXT;
BEGIN
    timestamp_part := substring(cast(extract(epoch from now()) as TEXT) from '.{4}$');
    clean_name := upper(regexp_replace(store_name, '[^A-Za-z]', '', 'g'));

    IF length(clean_name) >= 3 THEN
        name_prefix := substring(clean_name from 1 for 3);
    ELSE
        name_prefix := 'STO';
    END IF;

    RETURN name_prefix || '-' || timestamp_part;
END;
$$ LANGUAGE plpgsql;

-- 3. Migrar datos de storeInfo a stores
DO $$
DECLARE
    user_record RECORD;
    store_id INTEGER;
    store_number VARCHAR(255);
    image_url TEXT;
BEGIN
    -- Iterar sobre todos los usuarios que tienen storeInfo
    FOR user_record IN 
        SELECT id, "storeInfo" 
        FROM users 
        WHERE "storeInfo" IS NOT NULL 
        AND "storeInfo" != 'null' 
        AND "storeInfo" != '{}'
        AND "storeInfo"->>'name' IS NOT NULL
    LOOP
        -- Generar número de tienda único basado en el ID del usuario
        store_number := 'STORE-' || user_record.id;
        
        -- Obtener la primera imagen si existe (extraer como texto, no como JSON)
        image_url := NULL;
        IF user_record."storeInfo"->'images' IS NOT NULL AND jsonb_array_length(user_record."storeInfo"->'images') > 0 THEN
            image_url := user_record."storeInfo"->'images'->>0;
        END IF;
        
        -- Insertar tienda usando solo los campos existentes
        INSERT INTO stores (
            "storeNumber",
            name,
            phone,
            description,
            images,
            schedule,
            "ownerId",
            "createdAt",
            "updatedAt"
        ) VALUES (
            user_record."storeInfo"->>'address', -- Usar address como storeNumber
            user_record."storeInfo"->>'name',
            COALESCE(user_record."storeInfo"->>'phone', 'N/A'),
            COALESCE(user_record."storeInfo"->>'description', ''),
            user_record."storeInfo"->'images',
            user_record."storeInfo"->'schedule',
            user_record.id,
            NOW(),
            NOW()
        ) RETURNING id INTO store_id;
        
        RAISE NOTICE 'Tienda creada para usuario %: % (ID: %)', user_record.id, user_record."storeInfo"->>'name', store_id;
    END LOOP;
    
    RAISE NOTICE 'Migración completada. Total de tiendas creadas: %', (SELECT COUNT(*) FROM stores);
END $$;

-- 4. Mostrar resumen
SELECT 
    'Total de tiendas después de migración' as descripción,
    COUNT(*) as cantidad
FROM stores
UNION ALL
SELECT 
    'Usuarios que aún tienen storeInfo' as descripción,
    COUNT(*) as cantidad
FROM users
WHERE "storeInfo" IS NOT NULL
AND "storeInfo" != 'null'
AND "storeInfo" != '{}';

-- 5. Limpiar función temporal (opcional)
-- DROP FUNCTION IF EXISTS generate_store_number(TEXT);
