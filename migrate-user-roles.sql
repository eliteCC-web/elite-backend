-- Script completo para migrar usuarios de rol USER a CLIENTE_EXTERNO
-- Ejecutar este script en la base de datos PostgreSQL

-- 1. Verificar el estado actual antes de la migración
SELECT '=== ESTADO ACTUAL ===' as info;

SELECT 
    r.name as role_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN users_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

-- 2. Mostrar usuarios con rol USER que serán migrados
SELECT '=== USUARIOS CON ROL USER (SERÁN MIGRADOS) ===' as info;

SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    r.name as current_role
FROM users u
JOIN users_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'USER'
ORDER BY u.id;

-- 3. Verificar que existe el rol CLIENTE_EXTERNO
SELECT '=== VERIFICANDO ROL CLIENTE_EXTERNO ===' as info;

SELECT id, name, description FROM roles WHERE name = 'CLIENTE_EXTERNO';

-- 4. Realizar la migración
SELECT '=== REALIZANDO MIGRACIÓN ===' as info;

-- Actualizar usuarios con rol USER a CLIENTE_EXTERNO
UPDATE users_roles 
SET role_id = (SELECT id FROM roles WHERE name = 'CLIENTE_EXTERNO')
WHERE role_id = (SELECT id FROM roles WHERE name = 'USER');

-- 5. Verificar el resultado de la migración
SELECT '=== RESULTADO DE LA MIGRACIÓN ===' as info;

SELECT 
    r.name as role_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN users_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

-- 6. Mostrar usuarios migrados
SELECT '=== USUARIOS MIGRADOS A CLIENTE_EXTERNO ===' as info;

SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    r.name as new_role
FROM users u
JOIN users_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'CLIENTE_EXTERNO'
ORDER BY u.id;

-- 7. Verificar que no queden usuarios con rol USER
SELECT '=== VERIFICANDO QUE NO QUEDEN USUARIOS CON ROL USER ===' as info;

SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    r.name as role_name
FROM users u
JOIN users_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'USER';

-- 8. Resumen final
SELECT '=== RESUMEN FINAL ===' as info;

SELECT 
    'Migración completada' as status,
    (SELECT COUNT(*) FROM users_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'CLIENTE_EXTERNO') as usuarios_cliente_externo,
    (SELECT COUNT(*) FROM users_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'USER') as usuarios_user_restantes; 