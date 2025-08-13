import { Router } from 'express';
import { createAppointment } from '../controllers/opportunities';
import { 
  getTodayAppointments, 
  getAppointmentsByDateRange,
  convertAppointmentToService 
} from '../controllers/appointments';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear citas rápidas (disponible para todos los usuarios autenticados)
router.post('/', createAppointment);

// Obtener citas del día actual
router.get('/today', getTodayAppointments);

// Obtener citas por rango de fechas
router.get('/', getAppointmentsByDateRange);

// Convertir cita específica a servicio
router.post('/:id/convert-to-service', convertAppointmentToService);

export default router;