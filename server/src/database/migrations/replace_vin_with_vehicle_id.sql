-- Migración para reemplazar vin con vehicle_id en opportunities
-- Fecha: 2025-08-06
-- OBJETIVO: Arquitectura correcta usando vehicle_id en lugar de vin directamente

-- PASO 1: Agregar columna vehicle_id
ALTER TABLE opportunities ADD COLUMN vehicle_id INTEGER;

-- PASO 2: Migrar datos existentes (si hay registros)
-- Actualizar vehicle_id basándose en vin existente
UPDATE opportunities 
SET vehicle_id = v.vehicle_id 
FROM vehicles v 
WHERE opportunities.vin = v.vin 
AND opportunities.vin IS NOT NULL;

-- PASO 3: Hacer customer_id nullable para citas rápidas
ALTER TABLE opportunities ALTER COLUMN customer_id DROP NOT NULL;

-- PASO 4: Eliminar columna vin (ya no la necesitamos)
ALTER TABLE opportunities DROP COLUMN vin;

-- PASO 5: Agregar foreign key constraint para vehicle_id
ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_vehicle_id 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id);

-- PASO 6: Crear índice para optimizar búsquedas
CREATE INDEX idx_opportunities_vehicle_id ON opportunities(vehicle_id);

-- PASO 7: Documentar los cambios
COMMENT ON COLUMN opportunities.vehicle_id IS 'ID del vehículo - NULL para citas rápidas sin vehículo asignado';
COMMENT ON COLUMN opportunities.customer_id IS 'ID del cliente - NULL para citas rápidas sin cliente asignado';