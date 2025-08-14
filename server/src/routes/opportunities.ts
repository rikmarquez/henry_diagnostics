import { Router } from 'express';
import {
  createOpportunity,
  searchOpportunities,
  getOpportunityById,
  updateOpportunity,
  addOpportunityNote,
  getOpportunitiesByVehicle,
  getRemindersToday,
  createAppointment,
  convertOpportunityToAppointment,
  rescheduleAppointment,
  cancelAppointment,
} from '../controllers/opportunities';
import { authenticateToken, requireMecanicoOrAdmin, requireSeguimientoOrAdmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Búsqueda de oportunidades (disponible para todos los usuarios autenticados)
router.get('/search', searchOpportunities);

// Recordatorios del día (disponible para todos los usuarios autenticados)
router.get('/reminders/today', getRemindersToday);

// Obtener oportunidades por vehículo (disponible para todos los usuarios autenticados)
router.get('/vehicle/:vehicleId', getOpportunitiesByVehicle);

// Obtener oportunidad por ID (disponible para todos los usuarios autenticados)
router.get('/:id', getOpportunityById);

// Solo mecánicos y administradores pueden crear oportunidades
router.post('/', requireMecanicoOrAdmin, createOpportunity);

// Crear citas rápidas (disponible para todos los usuarios autenticados)
router.post('/appointments', createAppointment);

// Solo personal de seguimiento y administradores pueden actualizar oportunidades
router.put('/:id', requireSeguimientoOrAdmin, updateOpportunity);

// Solo personal de seguimiento y administradores pueden agregar notas
router.post('/:id/notes', requireSeguimientoOrAdmin, addOpportunityNote);

// Convertir oportunidad a cita (disponible para todos los usuarios autenticados)
router.post('/:id/convert-to-appointment', convertOpportunityToAppointment);

// Reagendar cita (disponible para todos los usuarios autenticados)
router.put('/:id/reschedule', rescheduleAppointment);

// Cancelar cita (disponible para todos los usuarios autenticados)
router.put('/:id/cancel', cancelAppointment);

export default router;