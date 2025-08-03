"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehiclesCount = exports.getVehicleHistory = exports.deleteVehicle = exports.updateVehicle = exports.getVehicleByVin = exports.searchVehicles = exports.createVehicle = void 0;
const zod_1 = require("zod");
const connection_1 = require("../database/connection");
const vinSchema = zod_1.z.string().transform(val => val === '' ? undefined : val).optional();
const placaSchema = zod_1.z.string().min(1, 'Placa requerida');
const vehicleSchema = zod_1.z.object({
    vin: vinSchema,
    marca: zod_1.z.string().min(1, 'Marca requerida'),
    modelo: zod_1.z.string().min(1, 'Modelo requerido'),
    año: zod_1.z.number().int().min(1900).max(new Date().getFullYear() + 1, 'Año inválido'),
    placa_actual: placaSchema,
    customer_id: zod_1.z.number().int().positive('ID de cliente inválido').optional(),
    kilometraje_actual: zod_1.z.number().int().min(0, 'Kilometraje no puede ser negativo').default(0),
    color: zod_1.z.string().optional(),
    numero_motor: zod_1.z.string().optional(),
    tipo_combustible: zod_1.z.enum(['gasolina', 'diesel', 'hibrido', 'electrico']).default('gasolina'),
    transmision: zod_1.z.enum(['manual', 'automatica']).default('manual'),
    notas: zod_1.z.string().optional(),
});
const updateVehicleSchema = vehicleSchema.partial().omit({ vin: true });
const searchSchema = zod_1.z.object({
    placa: zod_1.z.string().optional(),
    vin: zod_1.z.string().optional(),
    customer_name: zod_1.z.string().optional(),
    marca: zod_1.z.string().optional(),
    modelo: zod_1.z.string().optional(),
    año: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    offset: zod_1.z.string().optional(),
});
const createVehicle = async (req, res) => {
    try {
        const vehicleData = vehicleSchema.parse(req.body);
        // Verificar que el VIN no exista
        const existingVehicle = await (0, connection_1.query)('SELECT vin FROM vehicles WHERE vin = $1', [vehicleData.vin]);
        if (existingVehicle.rows.length > 0) {
            return res.status(400).json({ message: 'Ya existe un vehículo con este VIN' });
        }
        // Verificar que el customer_id exista si se proporciona
        if (vehicleData.customer_id) {
            const customerExists = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE customer_id = $1', [vehicleData.customer_id]);
            if (customerExists.rows.length === 0) {
                return res.status(400).json({ message: 'Cliente no encontrado' });
            }
        }
        // Verificar que la placa no esté en uso por otro vehículo
        if (vehicleData.placa_actual) {
            const plateExists = await (0, connection_1.query)('SELECT vin FROM vehicles WHERE placa_actual = $1 AND activo = true', [vehicleData.placa_actual]);
            if (plateExists.rows.length > 0) {
                return res.status(400).json({ message: 'Estas placas ya están registradas en otro vehículo' });
            }
        }
        const result = await (0, connection_1.query)(`
      INSERT INTO vehicles (
        vin, marca, modelo, año, placa_actual, customer_id, kilometraje_actual,
        color, numero_motor, tipo_combustible, transmision, notas, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
            vehicleData.vin,
            vehicleData.marca,
            vehicleData.modelo,
            vehicleData.año,
            vehicleData.placa_actual || null,
            vehicleData.customer_id || null,
            vehicleData.kilometraje_actual,
            vehicleData.color || null,
            vehicleData.numero_motor || null,
            vehicleData.tipo_combustible,
            vehicleData.transmision,
            vehicleData.notas || null,
            true
        ]);
        // Si hay customer_id, obtener la información completa del vehículo con el cliente
        let vehicleWithCustomer = result.rows[0];
        if (vehicleData.customer_id) {
            const vehicleWithCustomerResult = await (0, connection_1.query)(`
        SELECT 
          v.*,
          c.nombre as customer_nombre,
          c.telefono as customer_telefono,
          c.whatsapp as customer_whatsapp,
          c.email as customer_email,
          c.direccion as customer_direccion
        FROM vehicles v
        LEFT JOIN customers c ON v.customer_id = c.customer_id
        WHERE v.vin = $1
      `, [result.rows[0].vin]);
            if (vehicleWithCustomerResult.rows.length > 0) {
                const row = vehicleWithCustomerResult.rows[0];
                const { customer_nombre, customer_telefono, customer_whatsapp, customer_email, customer_direccion, ...vehicleData } = row;
                vehicleWithCustomer = {
                    ...vehicleData,
                    customer: customer_nombre ? {
                        nombre: customer_nombre,
                        telefono: customer_telefono,
                        whatsapp: customer_whatsapp,
                        email: customer_email,
                        direccion: customer_direccion
                    } : null
                };
            }
        }
        res.status(201).json({
            message: 'Vehículo registrado exitosamente',
            vehicle: vehicleWithCustomer,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error creando vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.createVehicle = createVehicle;
const searchVehicles = async (req, res) => {
    try {
        const { placa, vin, customer_name, marca, modelo, año, limit = '50', offset = '0' } = searchSchema.parse(req.query);
        let whereConditions = ['v.activo = true'];
        let queryParams = [];
        let paramIndex = 1;
        // Para búsquedas combinadas de placa y customer_name (que vienen del frontend)
        // necesitamos usar OR para que funcione correctamente
        if (placa && customer_name && placa === customer_name) {
            // Es una búsqueda desde el frontend que envía el mismo valor para ambos campos
            whereConditions.push(`(v.placa_actual ILIKE $${paramIndex} OR c.nombre ILIKE $${paramIndex + 1})`);
            queryParams.push(`%${placa}%`, `%${customer_name}%`);
            paramIndex += 2;
        }
        else {
            // Búsquedas individuales con AND como antes
            if (placa) {
                whereConditions.push(`v.placa_actual ILIKE $${paramIndex}`);
                queryParams.push(`%${placa}%`);
                paramIndex++;
            }
            if (vin) {
                whereConditions.push(`v.vin ILIKE $${paramIndex}`);
                queryParams.push(`%${vin}%`);
                paramIndex++;
            }
            if (customer_name) {
                whereConditions.push(`c.nombre ILIKE $${paramIndex}`);
                queryParams.push(`%${customer_name}%`);
                paramIndex++;
            }
        }
        if (marca) {
            whereConditions.push(`v.marca ILIKE $${paramIndex}`);
            queryParams.push(`%${marca}%`);
            paramIndex++;
        }
        if (modelo) {
            whereConditions.push(`v.modelo ILIKE $${paramIndex}`);
            queryParams.push(`%${modelo}%`);
            paramIndex++;
        }
        if (año) {
            whereConditions.push(`v."año" = $${paramIndex}`);
            queryParams.push(parseInt(año));
            paramIndex++;
        }
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = Math.max(parseInt(offset), 0);
        queryParams.push(limitNum, offsetNum);
        const searchQuery = `
      SELECT 
        v.*,
        c.nombre as customer_nombre,
        c.telefono as customer_telefono,
        c.email as customer_email
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.customer_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY v.fecha_actualizacion DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        console.log('🔍 Search Query:', searchQuery);
        console.log('🔍 Query Params:', queryParams);
        console.log('🔍 Where Conditions:', whereConditions);
        const result = await (0, connection_1.query)(searchQuery, queryParams);
        console.log('🔍 Search Result Rows:', result.rows.length);
        console.log('🔍 First few results:', result.rows.slice(0, 3));
        // Contar total de resultados
        const countQuery = `
      SELECT COUNT(*) as total
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.customer_id
      WHERE ${whereConditions.join(' AND ')}
    `;
        const countResult = await (0, connection_1.query)(countQuery, queryParams.slice(0, -2));
        // Estructurar los datos del cliente como objeto anidado
        const structuredVehicles = result.rows.map(row => {
            const { customer_nombre, customer_telefono, customer_email, ...vehicleData } = row;
            return {
                ...vehicleData,
                customer: customer_nombre ? {
                    nombre: customer_nombre,
                    telefono: customer_telefono,
                    email: customer_email
                } : null
            };
        });
        res.json({
            vehicles: structuredVehicles,
            total: parseInt(countResult.rows[0].total),
            limit: limitNum,
            offset: offsetNum,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Parámetros de búsqueda inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error buscando vehículos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.searchVehicles = searchVehicles;
const getVehicleByVin = async (req, res) => {
    try {
        const vin = vinSchema.parse(req.params.vin);
        const result = await (0, connection_1.query)(`
      SELECT 
        v.*,
        c.nombre as customer_nombre,
        c.telefono as customer_telefono,
        c.whatsapp as customer_whatsapp,
        c.email as customer_email,
        c.direccion as customer_direccion
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.customer_id
      WHERE v.vin = $1 AND v.activo = true
    `, [vin]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        // Obtener historial de placas
        const plateHistory = await (0, connection_1.query)(`
      SELECT placa_anterior, fecha_cambio, motivo_cambio, notas
      FROM vehicle_plate_history
      WHERE vin = $1
      ORDER BY fecha_cambio DESC
    `, [vin]);
        // Estructurar los datos del cliente como objeto anidado
        const row = result.rows[0];
        const { customer_nombre, customer_telefono, customer_whatsapp, customer_email, customer_direccion, ...vehicleData } = row;
        const vehicle = {
            ...vehicleData,
            customer: customer_nombre ? {
                nombre: customer_nombre,
                telefono: customer_telefono,
                whatsapp: customer_whatsapp,
                email: customer_email,
                direccion: customer_direccion
            } : null,
            plate_history: plateHistory.rows,
        };
        res.json({ vehicle });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'VIN inválido',
                errors: error.errors.map(e => e.message),
            });
        }
        console.error('Error obteniendo vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getVehicleByVin = getVehicleByVin;
const updateVehicle = async (req, res) => {
    try {
        const vin = vinSchema.parse(req.params.vin);
        const updateData = updateVehicleSchema.parse(req.body);
        // Verificar que el vehículo existe
        const vehicleExists = await (0, connection_1.query)('SELECT vin, placa_actual FROM vehicles WHERE vin = $1 AND activo = true', [vin]);
        if (vehicleExists.rows.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        const currentVehicle = vehicleExists.rows[0];
        // Si se está cambiando la placa, verificar que no esté en uso y registrar el cambio
        if (updateData.placa_actual && updateData.placa_actual !== currentVehicle.placa_actual) {
            const plateExists = await (0, connection_1.query)('SELECT vin FROM vehicles WHERE placa_actual = $1 AND vin != $2 AND activo = true', [updateData.placa_actual, vin]);
            if (plateExists.rows.length > 0) {
                return res.status(400).json({ message: 'Estas placas ya están registradas en otro vehículo' });
            }
            // Registrar cambio de placas en el historial
            if (currentVehicle.placa_actual) {
                await (0, connection_1.query)(`
          INSERT INTO vehicle_plate_history (vin, placa_anterior, fecha_cambio, motivo_cambio, creado_por)
          VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)
        `, [vin, currentVehicle.placa_actual, 'actualizacion', req.user?.user_id]);
            }
        }
        // Verificar customer_id si se proporciona
        if (updateData.customer_id) {
            const customerExists = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE customer_id = $1', [updateData.customer_id]);
            if (customerExists.rows.length === 0) {
                return res.status(400).json({ message: 'Cliente no encontrado' });
            }
        }
        // Construir query de actualización dinámicamente
        const updates = [];
        const params = [];
        let paramIndex = 1;
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        });
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos para actualizar' });
        }
        params.push(vin);
        const updateQuery = `
      UPDATE vehicles 
      SET ${updates.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE vin = $${paramIndex}
      RETURNING *
    `;
        const result = await (0, connection_1.query)(updateQuery, params);
        res.json({
            message: 'Vehículo actualizado exitosamente',
            vehicle: result.rows[0],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error actualizando vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.updateVehicle = updateVehicle;
const deleteVehicle = async (req, res) => {
    try {
        const vin = vinSchema.parse(req.params.vin);
        // Verificar que el vehículo existe
        const vehicleExists = await (0, connection_1.query)('SELECT vin FROM vehicles WHERE vin = $1 AND activo = true', [vin]);
        if (vehicleExists.rows.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        // Soft delete - marcar como inactivo
        await (0, connection_1.query)('UPDATE vehicles SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP WHERE vin = $1', [vin]);
        res.json({ message: 'Vehículo eliminado exitosamente' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'VIN inválido',
                errors: error.errors.map(e => e.message),
            });
        }
        console.error('Error eliminando vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.deleteVehicle = deleteVehicle;
const getVehicleHistory = async (req, res) => {
    try {
        const vin = vinSchema.parse(req.params.vin);
        // Verificar que el vehículo existe
        const vehicleExists = await (0, connection_1.query)('SELECT vin FROM vehicles WHERE vin = $1', [vin]);
        if (vehicleExists.rows.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        // Obtener servicios realizados
        const services = await (0, connection_1.query)(`
      SELECT 
        s.*,
        c.nombre as customer_nombre,
        u.nombre as mecanico_nombre
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.customer_id
      LEFT JOIN users u ON s.usuario_mecanico = u.user_id
      WHERE s.vin = $1
      ORDER BY s.fecha_servicio DESC
    `, [vin]);
        // Obtener oportunidades
        const opportunities = await (0, connection_1.query)(`
      SELECT 
        o.*,
        c.nombre as customer_nombre,
        u.nombre as usuario_asignado_nombre
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN users u ON o.usuario_asignado = u.user_id
      WHERE o.vin = $1
      ORDER BY o.fecha_creacion DESC
    `, [vin]);
        // Obtener historial de placas
        const plateHistory = await (0, connection_1.query)(`
      SELECT 
        vph.*,
        u.nombre as creado_por_nombre
      FROM vehicle_plate_history vph
      LEFT JOIN users u ON vph.creado_por = u.user_id
      WHERE vph.vin = $1
      ORDER BY vph.fecha_cambio DESC
    `, [vin]);
        res.json({
            services: services.rows,
            opportunities: opportunities.rows,
            plate_history: plateHistory.rows,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'VIN inválido',
                errors: error.errors.map(e => e.message),
            });
        }
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getVehicleHistory = getVehicleHistory;
const getVehiclesCount = async (req, res) => {
    try {
        const result = await (0, connection_1.query)('SELECT COUNT(*) as count FROM vehicles WHERE activo = true');
        res.json({ count: parseInt(result.rows[0].count) });
    }
    catch (error) {
        console.error('Error obteniendo conteo de vehículos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getVehiclesCount = getVehiclesCount;
//# sourceMappingURL=vehicles.js.map