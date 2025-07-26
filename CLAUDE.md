# Henry's Diagnostics - Notas para Claude

## 🚨 CONFIGURACIÓN CRÍTICA DE DESPLIEGUE

### Backend Railway - Código Pre-compilado OBLIGATORIO

**PROBLEMA CONOCIDO:** Railway tiene problemas de permisos con TypeScript compiler (`tsc: Permission denied`)

**SOLUCIÓN PROBADA:**
1. ✅ Backend usa código JavaScript pre-compilado en `/server/dist`
2. ✅ NO hay script `build` en package.json 
3. ✅ TypeScript solo en `devDependencies`
4. ✅ Railway ejecuta `npm start` → `node dist/index.js`

### 📋 Proceso de Despliegue:
```bash
# 1. Compilar ANTES de commit
cd server
npm run compile

# 2. Verificar archivos .js generados
ls -la dist/

# 3. Commit incluyendo /dist
git add .
git commit -m "mensaje"
git push origin main
```

### ⚠️ NUNCA hacer:
- ❌ Agregar script `build` en package.json
- ❌ Poner TypeScript en `dependencies`
- ❌ Hacer push sin compilar primero

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

**Última actualización:** Julio 2025 - Sistema funcionando correctamente con código pre-compilado