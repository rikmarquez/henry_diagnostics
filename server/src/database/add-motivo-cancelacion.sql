-- Migración: Agregar campo motivo_cancelacion a tabla opportunities
-- Fecha: 2025-08-14 
-- Descripción: Agregar campo para registrar motivo de cancelación de citas

-- Verificar si la columna ya existe antes de agregar
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' 
        AND column_name = 'motivo_cancelacion'
    ) THEN
        ALTER TABLE opportunities 
        ADD COLUMN motivo_cancelacion TEXT;
    END IF;
END $$;

-- Agregar estado 'cancelado' si no existe ya en el CHECK constraint
-- Primero remover el constraint existente y volver a crearlo con el nuevo valor
DO $$ 
BEGIN 
    -- Verificar si 'cancelado' ya está en los valores permitidos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu 
            ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'opportunities' 
        AND ccu.column_name = 'estado'
        AND cc.check_clause LIKE '%cancelado%'
    ) THEN
        -- Remover constraint existente
        ALTER TABLE opportunities 
        DROP CONSTRAINT opportunities_estado_check;
        
        -- Agregar nuevo constraint con 'cancelado'
        ALTER TABLE opportunities 
        ADD CONSTRAINT opportunities_estado_check 
        CHECK (estado IN ('pendiente', 'contactado', 'agendado', 'en_proceso', 'completado', 'perdido', 'cancelado'));
    END IF;
END $$;

COMMIT;