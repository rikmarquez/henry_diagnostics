-- Migración para actualizar tabla services: reemplazar vin con vehicle_id
-- Fecha: 11 Agosto 2025
-- OBJETIVO: Usar vehicle_id en lugar de vin en tabla services para consistencia

-- PASO 1: Agregar columna vehicle_id a services
ALTER TABLE services ADD COLUMN vehicle_id INTEGER;

-- PASO 2: Migrar datos existentes
-- Actualizar vehicle_id basándose en vin existente
UPDATE services 
SET vehicle_id = v.vehicle_id 
FROM vehicles v 
WHERE services.vin = v.vin 
AND services.vin IS NOT NULL;

-- PASO 3: Para servicios sin VIN válido, intentar usar customer_id para encontrar un vehículo
-- (esto puede no ser 100% preciso si un cliente tiene múltiples vehículos)
UPDATE services 
SET vehicle_id = (
    SELECT v.vehicle_id 
    FROM vehicles v 
    WHERE v.customer_id = services.customer_id 
    AND v.activo = true 
    ORDER BY v.fecha_actualizacion DESC 
    LIMIT 1
)
WHERE services.vehicle_id IS NULL 
AND services.customer_id IS NOT NULL;

-- PASO 4: Hacer vehicle_id NOT NULL y agregar foreign key
-- Solo después de que todos los registros tengan vehicle_id válido
ALTER TABLE services ALTER COLUMN vehicle_id SET NOT NULL;
ALTER TABLE services ADD CONSTRAINT fk_services_vehicle_id 
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id);

-- PASO 5: Eliminar columna vin de services (ya no la necesitamos)
ALTER TABLE services DROP COLUMN IF EXISTS vin;

-- PASO 6: Crear índice para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_services_vehicle_id ON services(vehicle_id);

-- PASO 7: Documentar cambios
COMMENT ON COLUMN services.vehicle_id IS 'ID del vehículo al que se realizó el servicio';