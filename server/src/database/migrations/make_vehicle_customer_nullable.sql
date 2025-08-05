-- Migración para hacer vin y customer_id nullable en opportunities
-- Esto permite crear citas rápidas sin vehículo o cliente asignado
-- Fecha: 2025-08-05

-- Remover constraint NOT NULL de vin
ALTER TABLE opportunities ALTER COLUMN vin DROP NOT NULL;

-- Remover constraint NOT NULL de customer_id  
ALTER TABLE opportunities ALTER COLUMN customer_id DROP NOT NULL;

-- Comentario para documentar el cambio
COMMENT ON COLUMN opportunities.vin IS 'VIN del vehículo - NULL para citas rápidas sin vehículo asignado';
COMMENT ON COLUMN opportunities.customer_id IS 'ID del cliente - NULL para citas rápidas sin cliente asignado';