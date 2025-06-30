-- Migración para agregar el campo isService a la tabla stores
-- Este campo permite diferenciar entre tiendas comerciales y servicios

ALTER TABLE stores 
ADD COLUMN "isService" BOOLEAN DEFAULT FALSE;

-- Comentario para documentar el propósito del campo
COMMENT ON COLUMN stores."isService" IS 'Indica si el registro es un servicio (banco, corresponsal, etc.) en lugar de una tienda comercial';

-- Actualizar registros existentes para que sean tiendas por defecto
UPDATE stores SET "isService" = FALSE WHERE "isService" IS NULL; 