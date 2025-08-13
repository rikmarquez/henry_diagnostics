"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const mechanics_1 = require("../controllers/mechanics");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
// GET /api/mechanics - Obtener lista de mecánicos con filtros y paginación
router.get('/', mechanics_1.getMechanics);
// GET /api/mechanics/stats - Obtener estadísticas de mecánicos
router.get('/stats', mechanics_1.getMechanicsStats);
// GET /api/mechanics/branches - Obtener lista de sucursales para dropdown
router.get('/branches', mechanics_1.getBranches);
// GET /api/mechanics/debug - Endpoint temporal de debug
router.get('/debug', mechanics_1.debugMechanicTable);
// GET /api/mechanics/:id - Obtener mecánico por ID
router.get('/:id', mechanics_1.getMechanicById);
// POST /api/mechanics - Crear nuevo mecánico (solo administradores)
router.post('/', (0, auth_1.requireRole)(['administrador']), mechanics_1.createMechanic);
// PUT /api/mechanics/:id - Actualizar mecánico (solo administradores)
router.put('/:id', (0, auth_1.requireRole)(['administrador']), mechanics_1.updateMechanic);
// DELETE /api/mechanics/:id - Eliminar/desactivar mecánico (solo administradores)
router.delete('/:id', (0, auth_1.requireRole)(['administrador']), mechanics_1.deleteMechanic);
exports.default = router;
//# sourceMappingURL=mechanics.js.map