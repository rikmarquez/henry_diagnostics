import { Router } from 'express';
import {
  createVehicle,
  searchVehicles,
  getVehicleByVin,
  updateVehicle,
  deleteVehicle,
  getVehicleHistory,
} from '../controllers/vehicles';
import { authenticateToken, requireMecanicoOrAdmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Búsqueda de vehículos (disponible para todos los usuarios autenticados)
router.get('/search', searchVehicles);

// Obtener vehículo por VIN (disponible para todos los usuarios autenticados)
router.get('/:vin', getVehicleByVin);

// Obtener historial completo del vehículo (disponible para todos los usuarios autenticados)
router.get('/:vin/history', getVehicleHistory);

// Solo mecánicos y administradores pueden crear, actualizar y eliminar vehículos
router.post('/', requireMecanicoOrAdmin, createVehicle);
router.put('/:vin', requireMecanicoOrAdmin, updateVehicle);
router.delete('/:vin', requireMecanicoOrAdmin, deleteVehicle);

export default router;