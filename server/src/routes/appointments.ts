import { Router } from 'express';
import { createAppointment } from '../controllers/opportunities';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear citas rápidas (disponible para todos los usuarios autenticados)
router.post('/', createAppointment);

export default router;