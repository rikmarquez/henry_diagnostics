# Guía de Configuración - Henry Diagnostics

## 🎯 Resumen Rápido

Este proyecto implementa un sistema de seguimiento de clientes y vehículos para el taller mecánico Henry Diagnostics, **centrado en vehículos con VIN como identificador único permanente**.

## 🏗️ Arquitectura del Sistema

### Características Únicas
- **Centrado en vehículos, no en clientes**: Cada auto tiene su historial independiente
- **VIN como identificador permanente**: 17 caracteres únicos, no cambia nunca
- **Placas actualizables**: Las placas pueden cambiar, el VIN permanece
- **Búsqueda principal por placas**: Flujo natural del taller día a día
- **Oportunidades por vehículo**: Servicios sugeridos específicos por auto

## 📦 Instalación Paso a Paso

### 1. Preparar el Entorno

\`\`\`bash
# Verificar versiones
node --version  # Debe ser 18+
npm --version   # Debe ser 9+
psql --version  # Debe ser 14+

# Instalar PostgreSQL si no está instalado
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt install postgresql postgresql-contrib
\`\`\`

### 2. Configurar Base de Datos

\`\`\`bash
# Conectar a PostgreSQL como superusuario
psql -U postgres

# Crear base de datos
CREATE DATABASE henrys_diagnostics;
CREATE USER henry_user WITH PASSWORD 'henry_password_2024';
GRANT ALL PRIVILEGES ON DATABASE henrys_diagnostics TO henry_user;
\\q
\`\`\`

### 3. Configurar Proyecto

\`\`\`bash
cd henrys-diagnostics-app

# Instalar dependencias de todos los módulos
npm run install:all

# Configurar variables de entorno del servidor
cp server/.env.example server/.env

# Editar server/.env con tus credenciales:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=henrys_diagnostics
# DB_USER=henry_user
# DB_PASSWORD=henry_password_2024
\`\`\`

### 4. Inicializar Base de Datos

\`\`\`bash
# Crear todas las tablas
npm run db:migrate

# Insertar datos de ejemplo y usuarios por defecto
npm run db:seed
\`\`\`

### 5. Iniciar Aplicación

\`\`\`bash
# Opción 1: Iniciar todo junto
npm run dev

# Opción 2: Iniciar por separado
npm run server:dev  # Terminal 1
npm run client:dev  # Terminal 2
\`\`\`

## 🌐 Acceso a la Aplicación

- **Cliente (Frontend)**: http://localhost:5173
- **Servidor (API)**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 👤 Usuarios Predefinidos

### Administrador Principal
- **Email**: rik@rikmarquez.com
- **Contraseña**: HenryDiag2024$
- **Permisos**: Acceso completo, gestión de usuarios

### Mecánico de Prueba
- **Email**: mecanico@henrydiagnostics.com
- **Contraseña**: MecanicoHD2024!
- **Permisos**: Registro de vehículos, creación de oportunidades

### Personal de Seguimiento
- **Email**: ventas@henrydiagnostics.com
- **Contraseña**: VentasHD2024!
- **Permisos**: Gestión de recordatorios, contacto con clientes

## 🔍 Datos de Ejemplo Incluidos

### Clientes
- Juan Pérez García (+5215512345678)
- María González López (+5215587654321)  
- Carlos Rodríguez Méndez (+5215598765432)

### Vehículos
- **Nissan Tsuru 2008** - VIN: 1N4BL11D85C123456, Placas: ABC-123-A
- **Volkswagen Jetta 2015** - VIN: 3VWD17AJ9FM654321, Placas: DEF-456-B
- **Chevrolet Aveo 2018** - VIN: KL1TD66E98B789012, Placas: GHI-789-C
- **Honda Civic 2020** - VIN: 1HGBH41JXMN345678, Placas: JKL-012-D

### Catálogo de Servicios
- Cambio de aceite y filtro ($450)
- Afinación menor ($850)
- Afinación mayor ($1,500)
- Balanceo y rotación ($300)
- Cambio de frenos ($600-800)
- Servicio de transmisión ($900)
- Y más...

## 🛠️ Comandos de Desarrollo

### Base de Datos
\`\`\`bash
# Limpiar y recrear toda la BD
npm run db:migrate && npm run db:seed

# Solo recrear datos de ejemplo
npm run db:seed
\`\`\`

### Desarrollo
\`\`\`bash
# Restart servidor (mantener cliente corriendo)
npm run server:dev

# Restart cliente (mantener servidor corriendo) 
npm run client:dev

# Ver logs del servidor
cd server && npm run dev

# Build para producción
npm run build
\`\`\`

## 🔧 Resolución de Problemas Comunes

### Error de Conexión a BD
\`\`\`bash
# Verificar que PostgreSQL esté corriendo
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
# Windows: Verificar en Servicios

# Verificar conexión
psql -U henry_user -d henrys_diagnostics -h localhost
\`\`\`

### Error de Permisos
\`\`\`bash
# Reinstalar dependencias
rm -rf node_modules client/node_modules server/node_modules
npm run install:all
\`\`\`

### Error de Puerto Ocupado
\`\`\`bash
# Cambiar puertos en archivos .env
# server/.env: PORT=3002
# client/.env: VITE_API_URL=http://localhost:3002

# O matar procesos
lsof -ti:3001 | xargs kill -9  # Servidor
lsof -ti:5173 | xargs kill -9  # Cliente
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
henrys-diagnostics-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilidades
│   └── public/            # Archivos estáticos
├── server/                # Backend Node.js
│   └── src/
│       ├── controllers/   # Lógica de endpoints
│       ├── routes/        # Definición de rutas
│       ├── middleware/    # Middleware personalizado
│       ├── database/      # Configuración BD
│       ├── models/        # Modelos de datos
│       └── types/         # TypeScript types
├── logo-henrys-diagnostics.png
├── package.json          # Scripts principales
└── README.md
\`\`\`

## 🚀 Próximos Pasos

Después de la instalación exitosa, puedes continuar con:

1. **Registrar vehículos reales** usando el VIN verdadero
2. **Crear oportunidades de ejemplo** para probar el sistema de seguimiento  
3. **Configurar recordatorios** para servicios próximos
4. **Personalizar marcas y modelos** según tu inventario
5. **Ajustar precios** en el catálogo de servicios

## 📞 Ayuda

Si tienes problemas con la configuración:
1. Verifica que todos los prerequisitos estén instalados
2. Revisa los logs en la consola del servidor
3. Confirma que la base de datos esté corriendo
4. Verifica las variables de entorno

---

**¡Listo para comenzar a usar Henry Diagnostics!** 🚗⚡