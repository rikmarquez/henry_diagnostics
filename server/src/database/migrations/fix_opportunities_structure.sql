-- Migración CORRECTA: Hacer vehicle_id y customer_id nullable para permitir citas rápidas
-- Fecha: 2025-08-06
-- PROBLEMA: La migración anterior intentaba modificar 'vin' que NO existe en opportunities
-- SOLUCIÓN: opportunities usa vehicle_id, NO vin directamente

-- Hacer vehicle_id nullable (para citas sin vehículo asignado)
ALTER TABLE opportunities ALTER COLUMN vehicle_id DROP NOT NULL;

-- Hacer customer_id nullable (para citas sin cliente asignado)  
ALTER TABLE opportunities ALTER COLUMN customer_id DROP NOT NULL;

-- Agregar campos específicos de citas si no existen
DO $$
BEGIN
    -- Verificar si la columna tiene_cita ya existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'tiene_cita') THEN
        ALTER TABLE opportunities ADD COLUMN tiene_cita BOOLEAN DEFAULT false;
    END IF;
    
    -- Verificar si la columna cita_fecha ya existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'cita_fecha') THEN
        ALTER TABLE opportunities ADD COLUMN cita_fecha DATE;
    END IF;
    
    -- Verificar si la columna cita_hora ya existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'cita_hora') THEN
        ALTER TABLE opportunities ADD COLUMN cita_hora TIME;
    END IF;
    
    -- Verificar si la columna cita_descripcion_breve ya existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'cita_descripcion_breve') THEN
        ALTER TABLE opportunities ADD COLUMN cita_descripcion_breve TEXT;
    END IF;
    
    -- Verificar si la columna cita_telefono_contacto ya existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'cita_telefono_contacto') THEN
        ALTER TABLE opportunities ADD COLUMN cita_telefono_contacto VARCHAR(20);
    END IF;
    
    -- Verificar si la columna cita_nombre_contacto ya existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'cita_nombre_contacto') THEN
        ALTER TABLE opportunities ADD COLUMN cita_nombre_contacto VARCHAR(100);
    END IF;
END $$;

-- Documentar los cambios
COMMENT ON COLUMN opportunities.vehicle_id IS 'ID del vehículo - NULL para citas rápidas sin vehículo asignado';
COMMENT ON COLUMN opportunities.customer_id IS 'ID del cliente - NULL para citas rápidas sin cliente asignado';
COMMENT ON COLUMN opportunities.tiene_cita IS 'Indica si esta oportunidad es una cita agendada';
COMMENT ON COLUMN opportunities.cita_fecha IS 'Fecha de la cita (solo para registros con tiene_cita=true)';
COMMENT ON COLUMN opportunities.cita_hora IS 'Hora de la cita (solo para registros con tiene_cita=true)';