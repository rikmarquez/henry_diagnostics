"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicles_1 = require("../controllers/vehicles");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticateToken);
// Obtener conteo de vehículos (disponible para todos los usuarios autenticados)
router.get('/count', vehicles_1.getVehiclesCount);
// Búsqueda de vehículos (disponible para todos los usuarios autenticados)
router.get('/search', vehicles_1.searchVehicles);
// Obtener vehículo por VIN (disponible para todos los usuarios autenticados)
router.get('/:vin', vehicles_1.getVehicleByVin);
// Obtener vehículo por ID (disponible para todos los usuarios autenticados)
router.get('/id/:id', vehicles_1.getVehicleById);
// Obtener historial completo del vehículo (disponible para todos los usuarios autenticados)
router.get('/:vin/history', vehicles_1.getVehicleHistory);
// Solo mecánicos y administradores pueden crear, actualizar y eliminar vehículos
router.post('/', auth_1.requireMecanicoOrAdmin, vehicles_1.createVehicle);
router.put('/:vin', auth_1.requireMecanicoOrAdmin, vehicles_1.updateVehicle);
router.delete('/:vin', auth_1.requireMecanicoOrAdmin, vehicles_1.deleteVehicle);
exports.default = router;
//# sourceMappingURL=vehicles.js.map