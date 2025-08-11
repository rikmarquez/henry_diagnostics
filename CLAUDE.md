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

## 🚨 ESTADO ACTUAL DEL PROYECTO - SESIÓN 07 AGOSTO 2025

### 🎉 MÓDULO DE RECEPCIÓN COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL

#### ✅ **LOGROS DEL DÍA:**

**🚀 FUNCIONALIDADES PRINCIPALES IMPLEMENTADAS:**
- ✅ **Búsqueda de clientes existentes** - Autocompletado funcional
- ✅ **Carga de vehículos del cliente** - Lista completa de 4 autos
- ✅ **Navegación limpia** - Info usuario/rol removida del header
- ✅ **UX mejorada** - Toggle Cliente Nuevo/Existente intuitivo
- ✅ **Selección visual de vehículos** - Cards interactivas

**🔧 PROBLEMAS RESUELTOS HOY:**

#### **1. BÚSQUEDA DE CLIENTES NO FUNCIONABA:**
```javascript
// PROBLEMA: Parámetro incorrecto
?q=ricardo

// SOLUCIÓN: Parámetro correcto  
?nombre=ricardo

// RESULTADO: response.customers (no response.data)
```

#### **2. VEHÍCULOS NO CARGABAN (ERROR 500):**
```sql
-- PROBLEMA: JOINs complejos fallaban
SELECT v.*, COUNT(services), COUNT(opportunities)

-- SOLUCIÓN: Query simplificada estable
SELECT v.vehicle_id, v.marca, v.modelo, v.placa_actual...

-- RESULTADO: 4 vehículos del cliente cargan correctamente ✅
```

#### **3. MEJORAS UX IMPLEMENTADAS:**
- **Debounce 500ms** - Evita spam de requests API
- **Radio buttons** - Cliente Nuevo vs Existente
- **Dropdown inteligente** - Resultados en tiempo real  
- **Cards seleccionables** - Vehículos con hover/selección
- **Logs detallados** - Debugging completo con emojis

### 🎯 **FLUJO ACTUAL FUNCIONANDO:**

```
🚪 RECEPCIÓN → Cliente Existente → 
   ↓ Buscar "ricardo" (autocompletado)
   📋 Lista clientes → Seleccionar RICARDO MARQUEZ →
   ↓ Carga automática vehículos  
   🚗 4 vehículos mostrados → Seleccionar vehículo →
   ✅ Formulario pre-llenado → [SIGUIENTE PASO]
```

### 🚨 **PROBLEMA PENDIENTE PARA MAÑANA:**

#### **ERROR EN GUARDAR SERVICIO (POST /api/reception/walk-in 500):**

**Síntomas del error:**
- ✅ Búsqueda cliente funciona
- ✅ Carga vehículos funciona  
- ✅ Selección vehículo funciona
- ❌ **FALLA:** Guardar servicio → Error 500

**Error específico:**
```
POST /api/reception/walk-in 500 (Internal Server Error)
Error procesando walk-in: AxiosError status code 500
```

**Datos que se envían al backend:**
- Cliente: RICARDO MARQUEZ SOLANO (customer_id: 7)
- Vehículo: Uno de los 4 autos registrados
- Acción: servicio_inmediato
- Tipo servicio: [lo que escriba el usuario]

### 📋 **PLAN PARA MAÑANA:**

#### **PRIORIDAD 1: Debuggear error 500 en processWalkInClient**

**Pasos sugeridos:**
1. **Revisar logs Railway** - Ver error específico del backend
2. **Simplificar controlador** - Igual que hicimos con vehículos
3. **Validar datos enviados** - Revisar estructura del request
4. **Probar paso a paso** - Cliente nuevo vs existente

**Archivos a revisar:**
- `server/src/controllers/reception.ts` - Función `processWalkInClient`
- Posibles problemas:
  - Migración `origen_cita` no ejecutada
  - Query de inserción con campos incorrectos
  - Validaciones fallando
  - Estructura de datos inconsistente

#### **TEORÍA DEL PROBLEMA:**
El endpoint `processWalkInClient` probablemente tiene el mismo tipo de problema que `getCustomerVehicles` - queries con estructuras obsoletas o campos que no existen.

### 🎖️ **RESUMEN DE AVANCES TOTALES:**

```
✅ MÓDULO CITAS - 100% funcional
✅ MÓDULO RECEPCIÓN - 90% funcional
   ├── ✅ Navegación limpia  
   ├── ✅ Búsqueda clientes
   ├── ✅ Carga vehículos
   ├── ✅ UX cliente recurrente
   └── 🚨 Guardar servicio (PENDIENTE)
```

**Una vez resuelto el error 500 de guardar servicio, el módulo de recepción estará 100% funcional para uso en producción.**

---

## 📅 MÓDULO DE CITAS - ACUERDOS DE DISEÑO (COMPLETADO)

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
   origen_cita VARCHAR(50) -- AGREGADO HOY
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
   - ✅ Los JOINs entre tablas usan `vehicle_id` como referencia
   - ✅ VIN solo se usa si el cliente específicamente lo proporciona
   - ✅ Formularios NO requieren VIN como campo obligatorio

### ⚠️ IMPORTANTE - NO ASUMIR VIN:
- ❌ NO hacer VIN campo obligatorio
- ❌ NO usar VIN como clave foránea principal
- ❌ NO crear lógica que dependa de que VIN exista
- ✅ SIEMPRE usar **vehicle_id** como identificador principal

**Migración aplicada:** `vehicles.vin` permite NULL y cualquier longitud  
**Identificador único:** `vehicles.placa_actual` (requerido, único por vehículo activo)
**Clave principal:** `vehicles.vehicle_id` (para JOINs y relaciones)

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS HOY

### 🚪 **MÓDULO DE RECEPCIÓN - CARACTERÍSTICAS:**

#### **1. BÚSQUEDA INTELIGENTE DE CLIENTES:**
```
📝 Input con debounce 500ms
🔍 Autocompletado tiempo real  
📋 Dropdown con resultados
👤 Info: nombre + teléfono
✅ Selección → carga automática vehículos
```

#### **2. MANEJO DE CLIENTES RECURRENTES:**
```  
🔄 Toggle: Cliente Nuevo | Cliente Existente
📋 Si Existente:
   ├── 🔍 Búsqueda por nombre/teléfono
   ├── 📝 Lista de resultados
   ├── ✅ Selección automática
   └── 🚗 Carga vehículos del cliente

🆕 Si Nuevo:
   └── 📝 Formulario completo manual
```

#### **3. SELECCIÓN DE VEHÍCULOS:**
```
🚗 Lista visual de vehículos del cliente:
├── 📊 Cards interactivas con hover
├── 📝 Marca Modelo Año - Placas - KM  
├── ✅ Selección visual (borde azul)
├── ☑️ Checkbox: "Vehículo nuevo del cliente"
└── 📝 Form manual si es vehículo nuevo
```

#### **4. DEBUGGING COMPLETO:**
```
🔍 Console logs con emojis:
├── 🔍 Query de búsqueda enviada
├── 📋 Respuesta de API completa
├── ✅ Cantidad de resultados  
├── 🚗 Cliente seleccionado + ID
├── 🚙 Lista detallada de vehículos
└── ❌ Errores específicos con contexto
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### "Los cambios no aparecen en producción"
**Causa:** No se rebuildeó el frontend antes del deploy
**Solución:** 
```bash
cd client && npm run build && cd .. && git add . && git commit -m "Update frontend build" && git push
```

### "Error 500 en endpoints de API"  
**Causa:** Queries con JOINs complejos o campos obsoletos
**Solución:**
1. Simplificar query - solo campos básicos necesarios
2. Revisar logs Railway para error específico  
3. Validar estructura de tablas vs código
4. Agregar debugging detallado

### "Búsquedas no funcionan"
**Causa:** Parámetros de API incorrectos o estructura de respuesta
**Solución:**
1. Verificar parámetros: ?nombre= vs ?q=
2. Validar respuesta: response.customers vs response.data
3. Agregar logs para debugging
4. Implementar debounce si es necesario

---

**Última actualización:** 07 Agosto 2025 - Módulo de recepción 90% funcional, pendiente resolver error 500 en guardar servicio