"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_1 = require("../controllers/services");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
// Estadísticas de servicios
router.get('/stats', services_1.getServiceStats);
// Contador de servicios del mes actual (para Dashboard)
router.get('/count/month', services_1.getServiceCountThisMonth);
// Listar servicios con filtros y paginación
router.get('/', services_1.getServices);
// Obtener servicios recientes
router.get('/recent', services_1.getRecentServices);
// Obtener servicio por ID
router.get('/:id', services_1.getServiceById);
// Actualizar estado de servicio
router.put('/:id/status', services_1.updateServiceStatus);
exports.default = router;
//# sourceMappingURL=services.js.map