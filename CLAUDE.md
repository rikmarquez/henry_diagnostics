# Henry's Diagnostics - Notas para Claude

## 🚨 CONFIGURACIÓN CRÍTICA DE DESPLIEGUE

### Backend Railway - Código Pre-compilado OBLIGATORIO

**PROBLEMA CONOCIDO:** Railway tiene problemas de permisos con TypeScript compiler (`tsc: Permission denied`)

**SOLUCIÓN PROBADA:**
1. ✅ Backend usa código JavaScript pre-compilado en `/server/dist`
2. ✅ NO hay script `build` en package.json 
3. ✅ TypeScript solo en `devDependencies`
4. ✅ Railway ejecuta `npm start` → `node dist/index.js`

### Frontend Railway - Archivos Pre-construidos OBLIGATORIO

**PROBLEMA CONOCIDO:** Railway frontend usa archivos estáticos desde `/client/dist` - NO rebuiledea automáticamente

**SOLUCIÓN PROBADA:**
1. ✅ Frontend usa archivos pre-construidos en `/client/dist`
2. ✅ `railway.toml` configurado para servir archivos estáticos
3. ✅ DEBE hacer `npm run build` antes de cada deploy
4. ✅ Commit DEBE incluir archivos `/client/dist` actualizados

### 📋 Proceso de Despliegue COMPLETO:
```bash
# 1. Compilar BACKEND antes de commit
cd server
npm run compile

# 2. Compilar FRONTEND antes de commit 
cd ../client
npm run build

# 3. Verificar archivos generados
ls -la dist/
ls -la ../server/dist/

# 4. Commit incluyendo AMBOS /dist
cd ..
git add .
git commit -m "mensaje"
git push origin main
```

### ⚠️ NUNCA hacer:
- ❌ Agregar script `build` en server/package.json
- ❌ Poner TypeScript en `dependencies`
- ❌ Hacer push sin compilar backend Y frontend
- ❌ Esperar que Railway rebuildee automáticamente el frontend

---

## 📊 Estructura del Proyecto

- `/client` - Frontend React + TypeScript
- `/server` - Backend Express + TypeScript → JavaScript pre-compilado
- Base de datos: PostgreSQL

## 🔧 Comandos Útiles

### Backend:
- `npm run dev` - Desarrollo
- `npm run compile` - Compilar a JavaScript
- `npm start` - Producción

### Frontend:
- `npm run dev` - Desarrollo
- `npm run build` - Build de producción

---

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### "Los cambios no aparecen en producción"
**Causa:** No se rebuildeó el frontend antes del deploy
**Solución:** 
```bash
cd client && npm run build && cd .. && git add . && git commit -m "Update frontend build" && git push
```

### "Título sigue siendo 'Vite + React + TS'"
**Causa:** Build obsoleto del frontend
**Solución:** Misma que arriba - rebuild frontend

### "Formularios siguen mostrando campos viejos"
**Causa:** JavaScript compilado obsoleto
**Solución:** Misma que arriba - rebuild frontend

---

## 📅 MÓDULO DE CITAS - ACUERDOS DE DISEÑO

### ✅ CÓMO FUNCIONAN LAS CITAS RÁPIDAS:

**ACUERDO ESTABLECIDO:** Las citas son registros rápidos que NO requieren crear vehículos ni clientes.

1. **Al crear una cita:**
   - ✅ Solo se guardan datos básicos: fecha, hora, nombre contacto, teléfono, descripción del vehículo
   - ✅ Se crea registro en tabla `opportunities` con `tiene_cita = true`
   - ✅ NO se crean registros en tablas `vehicles` ni `customers`
   - ✅ Los campos `vehicle_id` y `customer_id` quedan NULL

2. **Cuando llega el cliente (día de la cita):**
   - ✅ Con la información completa se puede crear vehículo y cliente si es necesario
   - ✅ Se actualiza la oportunidad con `vehicle_id` y `customer_id` reales
   - ✅ Se cambia el estado de la oportunidad según corresponda

3. **Estructura en base de datos:**
   ```sql
   -- Campos de cita en tabla opportunities:
   tiene_cita BOOLEAN DEFAULT false
   cita_fecha DATE
   cita_hora TIME  
   cita_descripcion_breve TEXT
   cita_telefono_contacto VARCHAR(20)
   cita_nombre_contacto VARCHAR(100)
   ```

### ⚠️ IMPORTANTE - NO CAMBIAR:
- ❌ NO crear vehículos/clientes temporales al agendar cita
- ❌ NO requerir VIN o datos completos del vehículo
- ✅ Mantener proceso de "citas rápidas" simple y directo

---

## 🚗 ESTRATEGIA DE IDENTIFICACIÓN DE VEHÍCULOS - ACUERDO CRÍTICO

### ✅ VIN NO ES CLAVE PRIMARIA:

**ACUERDO ESTABLECIDO:** El campo VIN dejó de ser la clave principal para identificar vehículos.

1. **Campo VIN:**
   - ✅ VIN es opcional (puede estar en blanco/NULL)
   - ✅ Muy probable que siempre quede vacío
   - ✅ NUNCA vamos a buscar por VIN
   - ✅ NO es campo requerido para crear vehículos

2. **Identificación real de vehículos:**
   - ✅ **PLACAS** son el identificador principal único
   - ✅ Búsquedas se hacen por PLACAS, no por VIN
   - ✅ Las placas SÍ son requeridas y únicas
   - ✅ Índice único en `placa_actual` donde está activo

3. **Implicaciones en el código:**
   - ✅ Las consultas de búsqueda usan `placa_actual`
   - ✅ Los JOINs entre tablas pueden usar placas como referencia alternativa
   - ✅ VIN solo se usa si el cliente específicamente lo proporciona
   - ✅ Formularios NO requieren VIN como campo obligatorio

### ⚠️ IMPORTANTE - NO ASUMIR VIN:
- ❌ NO hacer VIN campo obligatorio
- ❌ NO usar VIN como clave foránea principal
- ❌ NO crear lógica que dependa de que VIN exista
- ✅ SIEMPRE usar PLACAS como identificador principal

**Migración aplicada:** `vehicles.vin` permite NULL y cualquier longitud  
**Identificador único:** `vehicles.placa_actual` (requerido, único por vehículo activo)

---

**Última actualización:** Agosto 2025 - Sistema funcionando correctamente con código pre-compilado BACKEND Y FRONTEND