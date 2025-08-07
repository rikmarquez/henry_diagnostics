-- Migración: Agregar campo origen_cita a tabla opportunities
-- Fecha: 07 Agosto 2025
-- Propósito: Rastrear el origen de cada cita para mejor seguimiento

-- Agregar campo origen_cita
ALTER TABLE opportunities 
ADD COLUMN origen_cita VARCHAR(50) DEFAULT 'manual' 
CHECK (origen_cita IN ('opportunity', 'llamada_cliente', 'walk_in', 'seguimiento', 'manual'));

-- Agregar índice para consultas por origen
CREATE INDEX idx_opportunities_origen_cita ON opportunities(origen_cita);

-- Comentarios explicativos
COMMENT ON COLUMN opportunities.origen_cita IS 'Origen de la cita: opportunity=desde oportunidad existente, llamada_cliente=cliente llamó, walk_in=cliente vino al taller, seguimiento=generada por seguimiento, manual=creada manualmente';