"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Rutas públicas
router.post('/login', auth_1.login);
router.post('/logout', auth_1.logout);
// Rutas protegidas
router.get('/profile', auth_2.authenticateToken, auth_1.getProfile);
router.put('/change-password', auth_2.authenticateToken, auth_1.changePassword);
// Solo administradores pueden registrar nuevos usuarios
router.post('/register', auth_2.authenticateToken, auth_2.requireAdmin, auth_1.register);
exports.default = router;
//# sourceMappingURL=auth.js.map