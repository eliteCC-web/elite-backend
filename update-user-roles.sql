-- Script para actualizar usuarios con rol USER a CLIENTE_EXTERNO
-- Ejecutar este script en la base de datos PostgreSQL

-- 1. Verificar usuarios con rol USER antes del cambio
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

-- 2. Obtener el ID del rol CLIENTE_EXTERNO
SELECT id, name, description FROM roles WHERE name = 'CLIENTE_EXTERNO';

-- 3. Obtener el ID del rol USER
SELECT id, name, description FROM roles WHERE name = 'USER';

-- 4. Actualizar usuarios con rol USER a CLIENTE_EXTERNO
-- Reemplaza los IDs con los valores reales obtenidos en los pasos 2 y 3
UPDATE users_roles 
SET role_id = (SELECT id FROM roles WHERE name = 'CLIENTE_EXTERNO')
WHERE role_id = (SELECT id FROM roles WHERE name = 'USER');

-- 5. Verificar el cambio
SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    r.name as role_name
FROM users u
JOIN users_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'CLIENTE_EXTERNO'
ORDER BY u.id;

-- 6. Verificar que no queden usuarios con rol USER
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

-- 7. Mostrar resumen de roles
SELECT 
    r.name as role_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN users_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY r.name; 