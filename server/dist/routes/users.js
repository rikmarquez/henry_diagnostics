"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const users_1 = require("../controllers/users");
const router = express_1.default.Router();
exports.usersRouter = router;
// Aplicar autenticación a todas las rutas
router.use(auth_1.authenticateToken);
// Aplicar autorización de administrador a todas las rutas
// Solo los administradores pueden gestionar usuarios
router.use(auth_1.requireAdmin);
// GET /api/users/stats - Obtener estadísticas de usuarios
router.get('/stats', users_1.getUserStats);
// GET /api/users - Obtener lista de usuarios con filtros y paginación
router.get('/', users_1.getUsers);
// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', users_1.getUserById);
// POST /api/users - Crear nuevo usuario
router.post('/', users_1.createUser);
// PUT /api/users/:id - Actualizar usuario
router.put('/:id', users_1.updateUser);
// POST /api/users/:id/reset-password - Restablecer contraseña de usuario
router.post('/:id/reset-password', users_1.resetUserPassword);
// GET /api/users/:id/activity - Obtener log de actividades del usuario
router.get('/:id/activity', users_1.getUserActivity);
//# sourceMappingURL=users.js.map