"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const customers_1 = __importDefault(require("./routes/customers"));
const opportunities_1 = __importDefault(require("./routes/opportunities"));
// Cargar variables de entorno
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware de seguridad
app.use((0, helmet_1.default)());
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use('/api/auth', auth_1.default);
app.use('/api/vehicles', vehicles_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/opportunities', opportunities_1.default);
// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});
// Middleware global de manejo de errores
app.use((err, req, res, next) => {
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
    console.log('💾 Para configurar la base de datos:');
    console.log('   npm run db:migrate - Crear tablas');
    console.log('   npm run db:seed - Insertar datos iniciales');
});
exports.default = app;
//# sourceMappingURL=index.js.map