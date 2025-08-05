"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opportunities_1 = require("../controllers/opportunities");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
// Crear citas rápidas (disponible para todos los usuarios autenticados)
router.post('/', opportunities_1.createAppointment);
exports.default = router;
//# sourceMappingURL=appointments.js.map