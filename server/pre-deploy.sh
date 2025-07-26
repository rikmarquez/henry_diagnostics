#!/bin/bash

# 🚀 Script de Pre-Despliegue para Railway
# Ejecutar ANTES de hacer commit/push

echo "🔥 HENRY'S DIAGNOSTICS - PRE-DEPLOY SCRIPT"
echo "==========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio /server"
    exit 1
fi

echo "📦 Compilando TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación de TypeScript"
    exit 1
fi

echo "✅ Compilación exitosa"

# Verificar que los archivos fueron generados
if [ ! -d "dist" ]; then
    echo "❌ Error: Directorio /dist no fue creado"
    exit 1
fi

echo "📁 Archivos generados en /dist:"
ls -la dist/

echo ""
echo "🚀 LISTO PARA DESPLIEGUE"
echo "======================="
echo "Ahora puedes hacer:"
echo "  git add ."
echo "  git commit -m 'tu mensaje'"
echo "  git push origin main"
echo ""
echo "⚠️  IMPORTANTE: NO olvides incluir los archivos /dist en el commit"