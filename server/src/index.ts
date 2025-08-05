import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import vehiclesRoutes from './routes/vehicles';
import customersRoutes from './routes/customers';
import opportunitiesRoutes from './routes/opportunities';
import appointmentsRoutes from './routes/appointments';
import { usersRouter } from './routes/users';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // máximo 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, inténtalo de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Henry Diagnostics API',
    version: '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/users', usersRouter);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

// Middleware global de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Henry Diagnostics Server iniciado');
  console.log(`📡 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('📋 Rutas disponibles:');
  console.log('   GET  /health - Health check');
  console.log('');
  console.log('🔐 Autenticación:');
  console.log('   POST /api/auth/login - Iniciar sesión');
  console.log('   POST /api/auth/logout - Cerrar sesión');
  console.log('   GET  /api/auth/profile - Obtener perfil');
  console.log('   PUT  /api/auth/change-password - Cambiar contraseña');
  console.log('   POST /api/auth/register - Registrar usuario (solo admin)');
  console.log('');
  console.log('🚗 Vehículos:');
  console.log('   GET  /api/vehicles/count - Conteo de vehículos');
  console.log('   GET  /api/vehicles/search - Buscar vehículos');
  console.log('   POST /api/vehicles - Registrar vehículo');
  console.log('   GET  /api/vehicles/:vin - Obtener vehículo por VIN');
  console.log('   PUT  /api/vehicles/:vin - Actualizar vehículo');
  console.log('   GET  /api/vehicles/:vin/history - Historial del vehículo');
  console.log('');
  console.log('👥 Clientes:');
  console.log('   GET  /api/customers/search - Buscar clientes');
  console.log('   POST /api/customers - Registrar cliente');
  console.log('   GET  /api/customers/:id - Obtener cliente por ID');
  console.log('   PUT  /api/customers/:id - Actualizar cliente');
  console.log('   GET  /api/customers/:id/vehicles - Vehículos del cliente');
  console.log('');
  console.log('💼 Oportunidades:');
  console.log('   GET  /api/opportunities/search - Buscar oportunidades');
  console.log('   POST /api/opportunities - Crear oportunidad');
  console.log('   GET  /api/opportunities/:id - Obtener oportunidad por ID');
  console.log('   PUT  /api/opportunities/:id - Actualizar oportunidad');
  console.log('   GET  /api/opportunities/vehicle/:vin - Oportunidades por VIN');
  console.log('   GET  /api/opportunities/reminders/today - Recordatorios del día');
  console.log('   POST /api/opportunities/:id/notes - Agregar nota de seguimiento');
  console.log('');
  console.log('📅 Citas:');
  console.log('   POST /api/appointments - Agendar cita rápida');
  console.log('');
  console.log('👤 Gestión de Usuarios (Solo Administradores):');
  console.log('   GET  /api/users/stats - Estadísticas de usuarios');
  console.log('   GET  /api/users - Lista de usuarios con filtros');
  console.log('   GET  /api/users/:id - Obtener usuario por ID');
  console.log('   POST /api/users - Crear nuevo usuario');
  console.log('   PUT  /api/users/:id - Actualizar usuario');
  console.log('   POST /api/users/:id/reset-password - Restablecer contraseña');
  console.log('   GET  /api/users/:id/activity - Log de actividades del usuario');
  console.log('');
  console.log('💾 Para configurar la base de datos:');
  console.log('   npm run db:migrate - Crear tablas');
  console.log('   npm run db:seed - Insertar datos iniciales');
});

export default app;