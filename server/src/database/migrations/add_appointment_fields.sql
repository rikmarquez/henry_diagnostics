-- Migración para agregar campos de cita preliminar a la tabla opportunities
-- Fecha: 2025-08-05

-- Agregar campos de cita preliminar
ALTER TABLE opportunities ADD COLUMN cita_fecha DATE;
ALTER TABLE opportunities ADD COLUMN cita_hora TIME;
ALTER TABLE opportunities ADD COLUMN cita_descripcion_breve TEXT;
ALTER TABLE opportunities ADD COLUMN cita_telefono_contacto VARCHAR(20);
ALTER TABLE opportunities ADD COLUMN cita_nombre_contacto VARCHAR(100);
ALTER TABLE opportunities ADD COLUMN tiene_cita BOOLEAN DEFAULT false;

-- Comentarios para documentar los campos
COMMENT ON COLUMN opportunities.cita_fecha IS 'Fecha programada para la cita (ej: 2025-08-15)';
COMMENT ON COLUMN opportunities.cita_hora IS 'Hora programada para la cita (ej: 14:30)';
COMMENT ON COLUMN opportunities.cita_descripcion_breve IS 'Descripción breve del vehículo (ej: Honda HRV 2022)';
COMMENT ON COLUMN opportunities.cita_telefono_contacto IS 'Teléfono de contacto para la cita';
COMMENT ON COLUMN opportunities.cita_nombre_contacto IS 'Nombre de la persona que agenda la cita';
COMMENT ON COLUMN opportunities.tiene_cita IS 'Indica si esta oportunidad es una cita agendada';

-- Índice para consultas rápidas de citas
CREATE INDEX idx_opportunities_citas ON opportunities (tiene_cita, cita_fecha, cita_hora) 
WHERE tiene_cita = true;

-- Índice para citas del día
CREATE INDEX idx_opportunities_citas_fecha ON opportunities (cita_fecha) 
WHERE tiene_cita = true;