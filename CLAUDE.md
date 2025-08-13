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
✅ CITAS CONVERSIÓN       - 100% funcional (citas → servicios)
✅ RECEPCIÓN              - 100% funcional (walk-in clients)
✅ CLIENTES               - 100% funcional
✅ VEHÍCULOS              - 100% funcional
✅ OPORTUNIDADES          - 100% funcional
✅ SERVICIOS              - 100% funcional (CRUD completo)
✅ MECÁNICOS              - 100% funcional (CRUD + asignaciones)
📱 DASHBOARD              - 95% funcional
🏢 FILTROS SUCURSAL       - 0% (pendiente)
📈 REPORTES               - 0% (pendiente)
```

### 🎯 **FLUJO OPERATIVO COMPLETO:**
```
📱 AGENDAR CITA → 📅 CITAS DEL DÍA → 🎯 CONVERTIR A SERVICIO
                                           ↓
🚪 RECEPCIÓN WALK-IN → 📋 CREAR SERVICIO → 🔧 ASIGNAR MECÁNICO
                                           ↓
📊 SERVICIOS → 💰 COTIZAR → ✅ AUTORIZAR → 🔧 EN PROCESO → 🎉 COMPLETADO
```

---

## 🔧 ARQUITECTURA CLAVE

### 📅 **Citas Rápidas:**
- Registro mínimo en `opportunities` con `tiene_cita = true`
- NO crean clientes/vehículos hasta conversión
- Conversión crea cliente/vehículo automáticamente

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

## 🎯 PRÓXIMOS PASOS SUGERIDOS

1. **🏢 Filtros por sucursal** - Implementar en todos los módulos
2. **📊 Dashboard segmentado** - Métricas por sucursal y mecánico  
3. **📈 Reportes avanzados** - Análisis rendimiento y conversión
4. **📱 App móvil** - Para mecánicos en campo
5. **🔔 Notificaciones** - SMS/WhatsApp automáticos

---

**🎉 Sistema listo para operación comercial inmediata**

**Última actualización:** 13 Agosto 2025 - Sistema completamente funcional