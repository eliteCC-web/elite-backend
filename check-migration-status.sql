-- Script para verificar el estado de la migración
-- Ejecutar antes y después de la migración para comparar

-- 1. Verificar usuarios con storeInfo
SELECT 
    'Usuarios con storeInfo' as tipo,
    COUNT(*) as cantidad
FROM users 
WHERE "storeInfo" IS NOT NULL 
AND "storeInfo" != 'null'
AND "storeInfo" != '{}'
UNION ALL
SELECT 
    'Usuarios sin storeInfo' as tipo,
    COUNT(*) as cantidad
FROM users 
WHERE "storeInfo" IS NULL 
OR "storeInfo" = 'null'
OR "storeInfo" = '{}';

-- 2. Mostrar detalles de usuarios con storeInfo
SELECT 
    id,
    email,
    "firstName",
    "lastName",
    "storeInfo"->>'name' as store_name,
    "storeInfo"->>'phone' as store_phone,
    "storeInfo"->>'address' as store_address,
    "storeInfo"->>'description' as store_description,
    "ownedStoreId" as has_store_relation
FROM users 
WHERE "storeInfo" IS NOT NULL 
AND "storeInfo" != 'null'
AND "storeInfo" != '{}'
ORDER BY id;

-- 3. Verificar tiendas existentes
SELECT 
    'Total de tiendas' as tipo,
    COUNT(*) as cantidad
FROM stores
UNION ALL
SELECT 
    'Tiendas con ownerId' as tipo,
    COUNT(*) as cantidad
FROM stores 
WHERE "ownerId" IS NOT NULL
UNION ALL
SELECT 
    'Tiendas sin ownerId' as tipo,
    COUNT(*) as cantidad
FROM stores 
WHERE "ownerId" IS NULL;

-- 4. Mostrar detalles de tiendas
SELECT 
    id,
    "storeNumber",
    name,
    phone,
    description,
    schedule,
    "ownerId",
    is_active,
    created_at
FROM stores
ORDER BY id;

-- 5. Verificar relaciones usuario-tienda
SELECT 
    u.id as user_id,
    u.email,
    u."firstName",
    u."lastName",
    u."ownedStoreId",
    s.id as store_id,
    s.name as store_name,
    s.store_number
FROM users u
LEFT JOIN stores s ON u."ownedStoreId" = s.id
WHERE u."storeInfo" IS NOT NULL 
AND u."storeInfo" != 'null'
AND u."storeInfo" != '{}'
ORDER BY u.id; 