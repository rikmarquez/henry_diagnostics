import { Router } from 'express';
import {
  createOpportunity,
  searchOpportunities,
  getOpportunityById,
  updateOpportunity,
  addOpportunityNote,
  getOpportunitiesByVin,
  getRemindersToday,
} from '../controllers/opportunities';
import { authenticateToken, requireMecanicoOrAdmin, requireSeguimientoOrAdmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Búsqueda de oportunidades (disponible para todos los usuarios autenticados)
router.get('/search', searchOpportunities);

// Recordatorios del día (disponible para todos los usuarios autenticados)
router.get('/reminders/today', getRemindersToday);

// Obtener oportunidades por VIN (disponible para todos los usuarios autenticados)
router.get('/vehicle/:vin', getOpportunitiesByVin);

// Obtener oportunidad por ID (disponible para todos los usuarios autenticados)
router.get('/:id', getOpportunityById);

// Solo mecánicos y administradores pueden crear oportunidades
router.post('/', requireMecanicoOrAdmin, createOpportunity);

// Solo personal de seguimiento y administradores pueden actualizar oportunidades
router.put('/:id', requireSeguimientoOrAdmin, updateOpportunity);

// Solo personal de seguimiento y administradores pueden agregar notas
router.post('/:id/notes', requireSeguimientoOrAdmin, addOpportunityNote);

export default router;