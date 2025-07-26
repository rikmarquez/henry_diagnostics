-- Migración para hacer VIN opcional y usar placa como identificador único
-- Fecha: 2025-07-26

-- 1. Hacer VIN opcional (permitir NULL)
ALTER TABLE vehicles ALTER COLUMN vin DROP NOT NULL;

-- 2. Permitir que VIN tenga cualquier longitud (cambiar de VARCHAR(17) a TEXT)
ALTER TABLE vehicles ALTER COLUMN vin TYPE TEXT;

-- 3. Agregar restricción única a placa_actual (solo para placas no nulas)
CREATE UNIQUE INDEX CONCURRENTLY idx_vehicles_placa_unique 
ON vehicles (placa_actual) 
WHERE placa_actual IS NOT NULL AND activo = true;

-- 4. Modificar check constraint para placa_actual (hacerla requerida)
ALTER TABLE vehicles ADD CONSTRAINT chk_placa_required 
CHECK (placa_actual IS NOT NULL AND placa_actual != '');

-- 5. Actualizar comentarios de la tabla para reflejar los cambios
COMMENT ON COLUMN vehicles.vin IS 'VIN del vehículo (opcional, permite cualquier longitud)';
COMMENT ON COLUMN vehicles.placa_actual IS 'Placas actuales del vehículo (requeridas, únicas)';

-- 6. Crear índice para búsquedas por VIN (para casos donde esté presente)
CREATE INDEX CONCURRENTLY idx_vehicles_vin_search 
ON vehicles (vin) 
WHERE vin IS NOT NULL AND vin != '';

-- 7. Crear índice compuesto para búsquedas frecuentes
CREATE INDEX CONCURRENTLY idx_vehicles_search 
ON vehicles (marca, modelo, año, activo);

-- Confirmar que las tablas relacionadas siguen funcionando
-- (vehicle_plate_history, services, opportunities siguen usando VIN como FK)