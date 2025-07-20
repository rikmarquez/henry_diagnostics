"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opportunities_1 = require("../controllers/opportunities");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
// Búsqueda de oportunidades (disponible para todos los usuarios autenticados)
router.get('/search', opportunities_1.searchOpportunities);
// Recordatorios del día (disponible para todos los usuarios autenticados)
router.get('/reminders/today', opportunities_1.getRemindersToday);
// Obtener oportunidades por VIN (disponible para todos los usuarios autenticados)
router.get('/vehicle/:vin', opportunities_1.getOpportunitiesByVin);
// Obtener oportunidad por ID (disponible para todos los usuarios autenticados)
router.get('/:id', opportunities_1.getOpportunityById);
// Solo mecánicos y administradores pueden crear oportunidades
router.post('/', auth_1.requireMecanicoOrAdmin, opportunities_1.createOpportunity);
// Solo personal de seguimiento y administradores pueden actualizar oportunidades
router.put('/:id', auth_1.requireSeguimientoOrAdmin, opportunities_1.updateOpportunity);
// Solo personal de seguimiento y administradores pueden agregar notas
router.post('/:id/notes', auth_1.requireSeguimientoOrAdmin, opportunities_1.addOpportunityNote);
exports.default = router;
//# sourceMappingURL=opportunities.js.map