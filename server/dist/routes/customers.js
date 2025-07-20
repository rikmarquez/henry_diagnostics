"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customers_1 = require("../controllers/customers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
// Búsqueda de clientes (disponible para todos los usuarios autenticados)
router.get('/search', customers_1.searchCustomers);
// Obtener cliente por ID (disponible para todos los usuarios autenticados)
router.get('/:id', customers_1.getCustomerById);
// Obtener vehículos del cliente (disponible para todos los usuarios autenticados)
router.get('/:id/vehicles', customers_1.getCustomerVehicles);
// Solo mecánicos y administradores pueden crear, actualizar y eliminar clientes
router.post('/', auth_1.requireMecanicoOrAdmin, customers_1.createCustomer);
router.put('/:id', auth_1.requireMecanicoOrAdmin, customers_1.updateCustomer);
router.delete('/:id', auth_1.requireMecanicoOrAdmin, customers_1.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customers.js.map