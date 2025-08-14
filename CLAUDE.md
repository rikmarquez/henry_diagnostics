# Henry's Diagnostics - Notas para Claude

## 🚨 CONFIGURACIÓN CRÍTICA DE DESPLIEGUE

### 📋 Proceso de Despliegue Railway:
```bash
# 1. Compilar BACKEND
cd server && npm run compile

# 2. Compilar FRONTEND 
cd ../client && npm run build

# 3. Commit incluyendo /dist
cd .. && git add . && git commit -m "mensaje" && git push
```

### ⚠️ NUNCA hacer:
- ❌ Push sin compilar backend Y frontend
- ❌ Agregar script `build` en server/package.json
- ❌ Poner TypeScript en `dependencies`

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### ✅ **MÓDULOS OPERATIVOS:**
```
✅ AUTENTICACIÓN          - 100% funcional
✅ CITAS PROGRAMACIÓN     - 100% funcional (crear citas rápidas)
✅ CITAS GESTIÓN          - 100% funcional (filtros + conversión oportunidad→cita)
✅ CITAS CONVERSIÓN       - 100% funcional (citas → servicios)
✅ RECEPCIÓN              - 100% funcional (walk-in clients)
✅ CLIENTES               - 100% funcional
✅ VEHÍCULOS              - 100% funcional
✅ OPORTUNIDADES          - 100% funcional (conversión a citas + trazabilidad)
✅ SERVICIOS              - 100% funcional (CRUD completo)
✅ MECÁNICOS              - 100% funcional (CRUD + asignaciones)
📱 DASHBOARD              - 95% funcional
🏢 FILTROS SUCURSAL       - 0% (pendiente)
📈 REPORTES               - 0% (pendiente)
```

### 🎯 **FLUJO OPERATIVO COMPLETO:**
```
💼 OPORTUNIDAD → 📅 PROGRAMAR CITA → 🎯 CONVERTIR A SERVICIO
       ↓                    ↓                    ↓
📱 CITA RÁPIDA → 📊 CITAS (HOY/SEMANA/MES) → 🔧 ASIGNAR MECÁNICO
       ↓                    ↓                    ↓
🚪 RECEPCIÓN WALK-IN → 📋 CREAR SERVICIO → 🔧 EN PROCESO → 🎉 COMPLETADO
```

---

## 🔧 ARQUITECTURA CLAVE

### 📅 **Sistema de Citas Completo:**

#### **Tipos de Citas:**
- **Citas Rápidas:** Registro mínimo en `opportunities` con `tiene_cita = true`
- **Oportunidades → Citas:** Conversión de oportunidades existentes con cliente/vehículo

#### **Módulo Citas:**
- **Filtros por período:** Hoy, Semana, Mes, Todas (futuras)
- **Corrección timezone:** Consistencia entre filtro y display 
- **Trazabilidad completa:** Info de cita visible en oportunidades
- **Estados inteligentes:** Visual feedback del estado de conversión

#### **Flujos Funcionales:**
- Dashboard → "Citas" → Filtros por período ✅
- Oportunidades → "Programar Cita" → Formulario conversión ✅
- Citas → "Convertir a Servicio" → Servicio completo ✅

### 🚗 **Identificación Vehículos:**
- **PLACAS** son identificador único principal (NO VIN)
- VIN es opcional y generalmente NULL
- Búsquedas por `placa_actual`, JOINs por `vehicle_id`

### 🔧 **Estados de Servicios:**
- `recibido` → `cotizado` → `autorizado` → `en_proceso` → `completado`
- Campo `precio` permite NULL en estado "recibido"
- Mecánicos: doble referencia (`usuario_mecanico` + `mechanic_id`)

---

## 🛠️ BASE DE DATOS

### **PostgreSQL (Railway):**
```
Host: shortline.proxy.rlwy.net:52806
DB: railway
User: postgres
Pass: uFXiUmoRNqxdKctJesvlRiLiOXuWTQac
```

### **Migraciones Críticas Aplicadas:**
- ✅ VIN → vehicle_id en opportunities y services
- ✅ Multi-sucursal: branches, mechanics, branch_id en tablas
- ✅ Estados "recibido", precio NULL permitido
- ✅ Traceabilidad conversión citas: converted_to_service_id

---

## 🚨 TROUBLESHOOTING COMÚN

### Error 500 en API
1. Revisar logs Railway para causa específica
2. Verificar migraciones aplicadas vs código
3. Simplificar queries complejas
4. Validar estructura de datos enviados

### Arrays PostgreSQL
```typescript
// ❌ MAL: JSON format
especialidades: JSON.stringify(array) // → "[]" 

// ✅ BIEN: PostgreSQL format
especialidades: array.length > 0 ? `{${array.join(',')}}` : '{}' // → {}
```

### Búsquedas no funcionan
- Verificar parámetros: `?nombre=` vs `?q=`
- Validar respuesta: `response.customers` vs `response.data`
- Implementar debounce apropiado

## 📋 AVANCES RECIENTES COMPLETADOS

### ✅ **MÓDULO CITAS AVANZADO (14 Agosto 2025):**

#### **Navegación Optimizada:**
- Menú "Citas del Día" → "Citas" (más general)
- Dashboard: Tarjeta "Citas" con conteo dinámico
- Reorganización menú secundario para mejor UX

#### **Filtros Inteligentes por Período:**
- 📅 **Hoy:** Solo citas del día actual
- 📆 **Semana:** Domingo a sábado actual  
- 🗓️ **Mes:** Todo el mes en curso
- 📋 **Todas:** Citas futuras (desde hoy)

#### **Conversión Oportunidad → Cita:**
- Botón "Programar Cita" funcional en detalle oportunidades
- Estados inteligentes: Disponible/Ya convertida/Sin datos
- Formulario completo con pre-llenado de datos
- Validaciones: solo si tiene cliente + vehículo asignados

#### **Trazabilidad y UI:**
- Información completa de cita en detalle oportunidad
- Sección destacada con datos: fecha, hora, contacto, teléfono
- Botón "Ya es una Cita" muestra fecha y hora
- UI verde para identificar oportunidades convertidas

#### **Correcciones Técnicas Críticas:**
- **Fix timezone:** Consistencia entre filtro y display de fechas
- **Fix pantalla blanca:** Eliminación de referencias obsoletas  
- **Debug logs:** Implementados para troubleshooting futuro

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

### **📅 CITAS - Funcionalidades Pendientes:**
1. **🔄 REAGENDAR CITA** - Cambiar fecha/hora de citas existentes
2. **❌ CANCELAR CITA** - Cambiar estado y liberar slot

### **🏢 Sistema General:**
3. **🏢 Filtros por sucursal** - Implementar en todos los módulos
4. **📊 Dashboard segmentado** - Métricas por sucursal y mecánico  
5. **📈 Reportes avanzados** - Análisis rendimiento y conversión
6. **📱 App móvil** - Para mecánicos en campo
7. **🔔 Notificaciones** - SMS/WhatsApp automáticos

---

**🎉 Sistema listo para operación comercial inmediata**

**Última actualización:** 14 Agosto 2025 - Módulo Citas Avanzado + Conversión Oportunidades