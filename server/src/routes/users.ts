import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getUserStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  getUserActivity
} from '../controllers/users';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar autorización de administrador a todas las rutas
// Solo los administradores pueden gestionar usuarios
router.use(requireAdmin);

// GET /api/users/stats - Obtener estadísticas de usuarios
router.get('/stats', getUserStats);

// GET /api/users - Obtener lista de usuarios con filtros y paginación
router.get('/', getUsers);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', getUserById);

// POST /api/users - Crear nuevo usuario
router.post('/', createUser);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', updateUser);

// POST /api/users/:id/reset-password - Restablecer contraseña de usuario
router.post('/:id/reset-password', resetUserPassword);

// GET /api/users/:id/activity - Obtener log de actividades del usuario
router.get('/:id/activity', getUserActivity);

export { router as usersRouter };