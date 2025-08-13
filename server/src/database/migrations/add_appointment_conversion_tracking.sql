-- Migración para agregar traceabilidad de conversión cita → servicio
-- Fecha: 2025-08-13
-- Funcionalidad: Conversión de citas en servicios

-- Agregar campo para trackear qué servicio se creó desde una cita
ALTER TABLE opportunities ADD COLUMN converted_to_service_id INTEGER;

-- Crear constraint de foreign key para mantener integridad referencial
ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_converted_service 
  FOREIGN KEY (converted_to_service_id) REFERENCES services(service_id) ON DELETE SET NULL;

-- Comentario para documentar el campo
COMMENT ON COLUMN opportunities.converted_to_service_id IS 'ID del servicio creado cuando se convierte esta cita. NULL = cita no convertida';

-- Índice para consultas de citas convertidas vs pendientes
CREATE INDEX idx_opportunities_converted ON opportunities (converted_to_service_id, tiene_cita) 
WHERE tiene_cita = true;

-- Índice para reportes de conversión
CREATE INDEX idx_opportunities_conversion_rate ON opportunities (tiene_cita, converted_to_service_id, cita_fecha);