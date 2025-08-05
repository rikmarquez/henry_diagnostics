# 🚨 MIGRACIÓN URGENTE REQUERIDA

## Problema
Los campos de citas no existen en la base de datos, por eso:
- Las citas no se pueden crear (falla al intentar insertar)
- Las citas no aparecen (los campos no existen para consultar)
- El dashboard no muestra estadísticas de citas

## Solución: Ejecutar Migración

### Opción 1: Railway Dashboard (Recomendado)
1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona tu proyecto Henry's Diagnostics
3. Ve a la base de datos PostgreSQL
4. Abre "Query"
5. **Copia y pega exactamente este código:**

```sql
-- Migración para agregar campos de cita preliminar a la tabla opportunities
-- Fecha: 2025-08-05

-- Agregar campos de cita preliminar
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_fecha DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_hora TIME;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_descripcion_breve TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_telefono_contacto VARCHAR(20);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_nombre_contacto VARCHAR(100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS tiene_cita BOOLEAN DEFAULT false;

-- Comentarios para documentar los campos
COMMENT ON COLUMN opportunities.cita_fecha IS 'Fecha programada para la cita (ej: 2025-08-15)';
COMMENT ON COLUMN opportunities.cita_hora IS 'Hora programada para la cita (ej: 14:30)';
COMMENT ON COLUMN opportunities.cita_descripcion_breve IS 'Descripción breve del vehículo (ej: Honda HRV 2022)';
COMMENT ON COLUMN opportunities.cita_telefono_contacto IS 'Teléfono de contacto para la cita';
COMMENT ON COLUMN opportunities.cita_nombre_contacto IS 'Nombre de la persona que agenda la cita';
COMMENT ON COLUMN opportunities.tiene_cita IS 'Indica si esta oportunidad es una cita agendada';

-- Índice para consultas rápidas de citas
CREATE INDEX IF NOT EXISTS idx_opportunities_citas ON opportunities (tiene_cita, cita_fecha, cita_hora) 
WHERE tiene_cita = true;

-- Índice para citas del día
CREATE INDEX IF NOT EXISTS idx_opportunities_citas_fecha ON opportunities (cita_fecha) 
WHERE tiene_cita = true;
```

6. Haz clic en "Execute"
7. Verifica que no haya errores

### Opción 2: psql Command Line (Si tienes acceso)
```bash
psql tu_database_url -c "
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_fecha DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_hora TIME;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_descripcion_breve TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_telefono_contacto VARCHAR(20);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cita_nombre_contacto VARCHAR(100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS tiene_cita BOOLEAN DEFAULT false;
"
```

## Verificación
Después de ejecutar la migración:
1. Recarga la aplicación
2. Intenta crear una cita
3. La cita debería aparecer en el módulo de citas
4. El dashboard debería mostrar estadísticas correctas

## ⚠️ IMPORTANTE
- **Ejecutar ANTES de usar el módulo de citas**
- **Es seguro ejecutar múltiples veces** (usa IF NOT EXISTS)
- **No afecta datos existentes**