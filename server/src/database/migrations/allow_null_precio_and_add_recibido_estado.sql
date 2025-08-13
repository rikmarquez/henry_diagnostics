-- Migración para permitir precio NULL y agregar estado "recibido"
-- Fecha: 2025-08-13
-- Funcionalidad: Permitir conversión de citas sin precio definido

-- 1. Permitir que el campo precio sea NULL
ALTER TABLE services ALTER COLUMN precio DROP NOT NULL;

-- 2. Agregar "recibido" al check constraint de estado
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_estado_check;

ALTER TABLE services ADD CONSTRAINT services_estado_check 
  CHECK (estado::text = ANY (ARRAY[
    'recibido'::character varying::text,
    'cotizado'::character varying::text, 
    'autorizado'::character varying::text, 
    'en_proceso'::character varying::text, 
    'completado'::character varying::text, 
    'cancelado'::character varying::text
  ]));

-- Comentarios para documentar los cambios
COMMENT ON COLUMN services.precio IS 'Precio del servicio. NULL cuando está en estado recibido, requerido desde cotizado';
COMMENT ON CONSTRAINT services_estado_check ON services IS 'Estados válidos: recibido, cotizado, autorizado, en_proceso, completado, cancelado';

-- Verificar que la migración fue exitosa
DO $$
BEGIN
    -- Verificar que precio puede ser NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'precio' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE 'SUCCESS: Campo precio ahora permite NULL';
    ELSE
        RAISE EXCEPTION 'ERROR: Campo precio todavía no permite NULL';
    END IF;
    
    -- Verificar que el constraint de estado incluye "recibido"
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'services' 
        AND ccu.column_name = 'estado'
        AND cc.check_clause LIKE '%recibido%'
    ) THEN
        RAISE NOTICE 'SUCCESS: Estado "recibido" agregado al check constraint';
    ELSE
        RAISE EXCEPTION 'ERROR: Estado "recibido" no encontrado en check constraint';
    END IF;
END $$;