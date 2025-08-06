-- Migración para agregar vehicle_id a opportunities y hacer campos nullable para citas rápidas
-- Fecha: 2025-08-06
-- PROBLEMA: opportunities no tiene vehicle_id, solo customer_id
-- SOLUCIÓN: Agregar vehicle_id como FK a vehicles y hacer ambos nullable

-- Agregar columna vehicle_id como foreign key a vehicles
ALTER TABLE opportunities ADD COLUMN vehicle_id INTEGER REFERENCES vehicles(vehicle_id);

-- Hacer customer_id nullable para citas rápidas sin cliente asignado
ALTER TABLE opportunities ALTER COLUMN customer_id DROP NOT NULL;

-- Documentar los cambios
COMMENT ON COLUMN opportunities.vehicle_id IS 'ID del vehículo - NULL para citas rápidas sin vehículo asignado';
COMMENT ON COLUMN opportunities.customer_id IS 'ID del cliente - NULL para citas rápidas sin cliente asignado';

-- Índice para optimizar búsquedas por vehicle_id
CREATE INDEX idx_opportunities_vehicle_id ON opportunities(vehicle_id);