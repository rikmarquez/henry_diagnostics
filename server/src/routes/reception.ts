import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  processWalkInClient,
  convertOpportunityToCita,
  receptionarCita,
  getCitasParaRecepcion
} from '../controllers/reception';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * RUTAS DE RECEPCIÓN DE CLIENTES
 */

// GET /api/reception/citas - Obtener citas del día para recepción
router.get('/citas', getCitasParaRecepcion);

// POST /api/reception/walk-in - Procesar cliente walk-in
router.post('/walk-in', processWalkInClient);

// POST /api/reception/convert-opportunity - Convertir opportunity en cita
router.post('/convert-opportunity', convertOpportunityToCita);

// POST /api/reception/recepcionar/:opportunity_id - Recepcionar cita (convertir en servicio)
router.post('/recepcionar/:opportunity_id', receptionarCita);

export { router as receptionRoutes };