import { Router } from 'express';
import { 
  getServiceStats,
  getServiceCountThisMonth,
  getServices,
  getServiceById,
  getRecentServices,
  updateServiceStatus,
  updateService
} from '../controllers/services';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Estadísticas de servicios
router.get('/stats', getServiceStats);

// Contador de servicios del mes actual (para Dashboard)
router.get('/count/month', getServiceCountThisMonth);

// Listar servicios con filtros y paginación
router.get('/', getServices);

// Obtener servicios recientes
router.get('/recent', getRecentServices);

// Obtener servicio por ID
router.get('/:id', getServiceById);

// Actualizar estado de servicio
router.put('/:id/status', updateServiceStatus);

// Actualizar servicio completo
router.put('/:id', updateService);

export default router;