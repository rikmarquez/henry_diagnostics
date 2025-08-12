-- Migración: Agregar campo 'alias' a la tabla mechanics
-- Fecha: 12 Agosto 2025
-- OBJETIVO: Agregar campo alias para identificación rápida de mecánicos

ALTER TABLE mechanics 
ADD COLUMN alias VARCHAR(15);

-- Crear índice para búsquedas rápidas por alias
CREATE INDEX idx_mechanics_alias ON mechanics(alias);

-- Agregar comentario al campo
COMMENT ON COLUMN mechanics.alias IS 'Alias o sobrenombre del mecánico para identificación rápida (máximo 15 caracteres)';

-- Ejemplo: Actualizar algunos mecánicos existentes con alias
-- UPDATE mechanics SET alias = 'Pepe' WHERE nombre LIKE '%José%' OR nombre LIKE '%Pepe%';
-- UPDATE mechanics SET alias = 'Memo' WHERE nombre LIKE '%Guillermo%';
-- UPDATE mechanics SET alias = 'Alex' WHERE nombre LIKE '%Alejandro%';