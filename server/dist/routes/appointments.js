"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opportunities_1 = require("../controllers/opportunities");
const appointments_1 = require("../controllers/appointments");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
// Crear citas rápidas (disponible para todos los usuarios autenticados)
router.post('/', opportunities_1.createAppointment);
// Obtener citas del día actual
router.get('/today', appointments_1.getTodayAppointments);
// Obtener citas por rango de fechas
router.get('/', appointments_1.getAppointmentsByDateRange);
// Convertir cita específica a servicio
router.post('/:id/convert-to-service', appointments_1.convertAppointmentToService);
exports.default = router;
//# sourceMappingURL=appointments.js.map