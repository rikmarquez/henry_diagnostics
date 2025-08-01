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

**Última actualización:** Julio 2025 - Sistema funcionando correctamente con código pre-compilado BACKEND Y FRONTEND