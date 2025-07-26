# Henry's Diagnostics - Backend Server

## 🚀 IMPORTANTE: Instrucciones de Despliegue

### ⚠️ **RAILWAY REQUIERE CÓDIGO PRE-COMPILADO**

**Este backend debe desplegarse con código JavaScript pre-compilado debido a problemas de permisos de TypeScript en contenedores Railway.**

### 📋 Proceso de Despliegue Correcto:

#### 1. **ANTES de hacer commit/push:**
```bash
# En el directorio /server
npm run compile  # Compila TypeScript a JavaScript
```

#### 2. **Verificar que existe `/dist` con archivos .js actualizados**
```bash
ls -la dist/  # Debe contener archivos .js recientes
```

#### 3. **Hacer commit incluyendo los archivos compilados:**
```bash
git add .                    # Incluye /dist con archivos .js
git commit -m "tu mensaje"
git push origin main
```

### 🛡️ **NO hacer nunca:**
- ❌ NO agregar script `build` en package.json
- ❌ NO poner TypeScript en `dependencies` (solo en `devDependencies`)
- ❌ NO hacer push sin compilar primero

### 📁 **Estructura de Despliegue:**
```
server/
├── dist/           ← ✅ Código JavaScript (Railway usa ESTO)
├── src/            ← ❌ Código TypeScript (Railway ignora esto)
├── package.json    ← ✅ Sin script "build"
└── README.md       ← Este archivo
```

### 🔧 **Scripts Disponibles:**
- `npm run dev` - Desarrollo con hot reload
- `npm run compile` - Compilar TypeScript a JavaScript
- `npm start` - Iniciar servidor (Railway usa este)

### 🏗️ **Cómo Railway Despliega:**
1. Railway NO compila TypeScript
2. Ejecuta `npm install` (solo dependencias de producción)
3. Ejecuta `npm start` → `node dist/index.js`
4. Sirve la aplicación desde archivos JavaScript pre-compilados

### 📝 **Notas Importantes:**
- Railway tiene problemas de permisos con `tsc`
- Siempre compilar localmente antes de desplegar
- Los archivos `.js` en `/dist` deben estar en el repositorio
- Esta configuración ya ha sido probada y funciona correctamente

---

**🚨 RECORDATORIO: Si olvidas compilar antes de desplegar, el deployment fallará.**