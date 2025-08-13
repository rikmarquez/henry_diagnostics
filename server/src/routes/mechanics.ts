import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getMechanics,
  getMechanicById,
  createMechanic,
  updateMechanic,
  deleteMechanic,
  getBranches,
  getMechanicsStats,
  debugMechanicTable
} from '../controllers/mechanics';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/mechanics - Obtener lista de mecánicos con filtros y paginación
router.get('/', getMechanics);

// GET /api/mechanics/stats - Obtener estadísticas de mecánicos
router.get('/stats', getMechanicsStats);

// GET /api/mechanics/branches - Obtener lista de sucursales para dropdown
router.get('/branches', getBranches);

// GET /api/mechanics/debug - Endpoint temporal de debug
router.get('/debug', debugMechanicTable);

// GET /api/mechanics/:id - Obtener mecánico por ID
router.get('/:id', getMechanicById);

// POST /api/mechanics - Crear nuevo mecánico (solo administradores)
router.post('/', requireRole(['administrador']), createMechanic);

// PUT /api/mechanics/:id - Actualizar mecánico (solo administradores)
router.put('/:id', requireRole(['administrador']), updateMechanic);

// DELETE /api/mechanics/:id - Eliminar/desactivar mecánico (solo administradores)
router.delete('/:id', requireRole(['administrador']), deleteMechanic);

export default router;