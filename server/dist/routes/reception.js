"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receptionRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reception_1 = require("../controllers/reception");
const router = (0, express_1.Router)();
exports.receptionRoutes = router;
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
/**
 * RUTAS DE RECEPCIÓN DE CLIENTES
 */
// GET /api/reception/citas - Obtener citas del día para recepción
router.get('/citas', reception_1.getCitasParaRecepcion);
// POST /api/reception/walk-in - Procesar cliente walk-in
router.post('/walk-in', reception_1.processWalkInClient);
// POST /api/reception/convert-opportunity - Convertir opportunity en cita
router.post('/convert-opportunity', reception_1.convertOpportunityToCita);
// POST /api/reception/recepcionar/:opportunity_id - Recepcionar cita (convertir en servicio)
router.post('/recepcionar/:opportunity_id', reception_1.receptionarCita);
//# sourceMappingURL=reception.js.map