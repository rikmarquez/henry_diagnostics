# Henry Diagnostics - Sistema de Seguimiento de Clientes

Sistema de gestión integral para taller mecánico centrado en el seguimiento de vehículos y oportunidades de venta.

## 🚗 Características Principales

### Gestión Centrada en Vehículos
- **VIN como identificador único permanente** - Cada vehículo mantiene su historial completo
- **Búsqueda principal por placas** - Flujo natural del taller
- **Historial independiente por vehículo** - Sin importar cambios de propietario
- **Gestión de cambio de placas** - Rastrea el historial completo

### Sistema de Oportunidades Inteligente
- **Oportunidades vinculadas a vehículos específicos**
- **Recordatorios automáticos**: 7 días, 3 días, 1 día antes del servicio
- **Inteligencia basada en historial** del vehículo específico
- **Estados de seguimiento** completos (pendiente → contactado → agendado → completado)

### Integración WhatsApp
- **Detección automática de dispositivo** (móvil/desktop)
- **Templates predefinidos** referenciando vehículo específico
- **Números mexicanos (+52)** con validación
- **Historial de comunicación por vehículo**

### Roles de Usuario
- **👨‍🔧 Técnico/Mecánico**: Registra vehículos y crea oportunidades
- **📞 Personal de Seguimiento**: Contacta clientes y gestiona recordatorios
- **👨‍💼 Administrador**: Dashboard completo y reportes

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT
- **Formularios**: React Hook Form + Zod
- **HTTP Client**: Axios + React Query

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
\`\`\`bash
git clone <url-del-repositorio>
cd henrys-diagnostics-app
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm run install:all
\`\`\`

### 3. Configurar base de datos
\`\`\`bash
# Crear base de datos PostgreSQL
createdb henrys_diagnostics

# Configurar variables de entorno
cp server/.env.example server/.env
# Editar server/.env con tus credenciales de PostgreSQL

# Ejecutar migraciones
npm run db:migrate

# Insertar datos semilla
npm run db:seed
\`\`\`

### 4. Iniciar aplicación
\`\`\`bash
# Modo desarrollo (cliente + servidor)
npm run dev

# O iniciar por separado:
npm run server:dev  # Puerto 3001
npm run client:dev  # Puerto 5173
\`\`\`

## 🔐 Credenciales de Acceso

### Usuario Administrador
- **Email**: rik@rikmarquez.com
- **Contraseña**: HenryDiag2024$

### Usuario Mecánico
- **Email**: mecanico@henrydiagnostics.com  
- **Contraseña**: MecanicoHD2024!

### Usuario Seguimiento
- **Email**: ventas@henrydiagnostics.com
- **Contraseña**: VentasHD2024!

⚠️ **IMPORTANTE**: Cambiar estas contraseñas en producción

## 📊 Base de Datos

### Tablas Principales

- **vehicles** - Vehículos (centrado en VIN)
- **customers** - Clientes/propietarios  
- **vehicle_plate_history** - Historial de placas por vehículo
- **opportunities** - Oportunidades de venta por vehículo
- **services** - Servicios realizados
- **scheduled_reminders** - Recordatorios automáticos
- **users** - Usuarios del sistema

### Índices Optimizados
- Búsqueda por VIN (único)
- Búsqueda por placas actuales
- Búsqueda por nombre de cliente
- Filtros por fecha y estado

## 🔄 Scripts Disponibles

### Root
- \`npm run dev\` - Inicia cliente y servidor
- \`npm run install:all\` - Instala todas las dependencias
- \`npm run db:migrate\` - Ejecuta migraciones
- \`npm run db:seed\` - Inserta datos semilla

### Server
- \`npm run server:dev\` - Servidor desarrollo con hot reload
- \`npm run server:build\` - Build producción
- \`npm run server:start\` - Inicia servidor producción

### Client  
- \`npm run client:dev\` - Cliente desarrollo
- \`npm run client:build\` - Build producción

## 🌍 Configuración de Despliegue

### Variables de Entorno Servidor
\`\`\`bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=henrys_diagnostics
DB_USER=postgres
DB_PASSWORD=password

# Seguridad
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=24h

# Servidor
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://tu-dominio.com
\`\`\`

### Variables de Entorno Cliente
\`\`\`bash
VITE_API_URL=https://api.tu-dominio.com
\`\`\`

## 📱 Funcionalidades por Implementar

Las siguientes funcionalidades están definidas en el diseño pero pendientes de implementación:

### ✅ Completado
- [x] Autenticación JWT con roles
- [x] Esquema de base de datos centrado en VIN
- [x] Interfaz de login con branding Henry Diagnostics
- [x] Dashboard básico

### 🔄 En Desarrollo  
- [ ] **Gestión de Vehículos**: Registro, búsqueda por placas/VIN/cliente
- [ ] **Gestión de Clientes**: CRUD vinculado a vehículos
- [ ] **Sistema de Oportunidades**: Creación y seguimiento por vehículo
- [ ] **Recordatorios Automáticos**: Sistema de alertas 7/3/1 días
- [ ] **Integración WhatsApp**: Enlaces nativos y templates
- [ ] **Dashboard y Reportes**: Métricas y KPIs

## 🛡️ Seguridad

- Autenticación JWT con expiración
- Validación de datos con Zod
- Rate limiting en API
- Headers de seguridad con Helmet
- Contraseñas hasheadas con bcrypt
- Validación de roles por endpoint

## 📞 Soporte

Para reportar issues o solicitar funcionalidades:
- Email: soporte@henrydiagnostics.com
- Crear issue en el repositorio

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

---

**Henry Diagnostics** - Sistema de Seguimiento de Clientes v1.0.0