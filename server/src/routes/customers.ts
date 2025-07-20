import { Router } from 'express';
import {
  createCustomer,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerVehicles,
} from '../controllers/customers';
import { authenticateToken, requireMecanicoOrAdmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Búsqueda de clientes (disponible para todos los usuarios autenticados)
router.get('/search', searchCustomers);

// Obtener cliente por ID (disponible para todos los usuarios autenticados)
router.get('/:id', getCustomerById);

// Obtener vehículos del cliente (disponible para todos los usuarios autenticados)
router.get('/:id/vehicles', getCustomerVehicles);

// Solo mecánicos y administradores pueden crear, actualizar y eliminar clientes
router.post('/', requireMecanicoOrAdmin, createCustomer);
router.put('/:id', requireMecanicoOrAdmin, updateCustomer);
router.delete('/:id', requireMecanicoOrAdmin, deleteCustomer);

export default router;