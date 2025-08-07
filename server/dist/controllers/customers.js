"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerVehicles = exports.deleteCustomer = exports.updateCustomer = exports.getCustomerById = exports.searchCustomers = exports.createCustomer = void 0;
const zod_1 = require("zod");
const connection_1 = require("../database/connection");
const phoneSchema = zod_1.z.string().regex(/^\+52[0-9]{10}$/, 'Formato de teléfono inválido (+5215512345678)');
const customerSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'Nombre requerido'),
    telefono: phoneSchema,
    rfc: zod_1.z.string().optional(),
});
const updateCustomerSchema = customerSchema.partial();
const searchSchema = zod_1.z.object({
    nombre: zod_1.z.string().optional(),
    telefono: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    offset: zod_1.z.string().optional(),
});
const createCustomer = async (req, res) => {
    try {
        const customerData = customerSchema.parse(req.body);
        // Verificar que el teléfono no esté registrado
        const existingCustomer = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE telefono = $1', [customerData.telefono]);
        if (existingCustomer.rows.length > 0) {
            return res.status(400).json({ message: 'Ya existe un cliente con este número de teléfono' });
        }
        const result = await (0, connection_1.query)(`
      INSERT INTO customers (
        nombre, telefono, whatsapp, rfc
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
            customerData.nombre,
            customerData.telefono,
            customerData.telefono, // WhatsApp igual al teléfono
            customerData.rfc || null,
        ]);
        res.status(201).json({
            message: 'Cliente registrado exitosamente',
            customer: result.rows[0],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error creando cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.createCustomer = createCustomer;
const searchCustomers = async (req, res) => {
    try {
        const { nombre, telefono, limit = '50', offset = '0' } = searchSchema.parse(req.query);
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;
        if (nombre) {
            whereConditions.push(`nombre ILIKE $${paramIndex}`);
            queryParams.push(`%${nombre}%`);
            paramIndex++;
        }
        if (telefono) {
            whereConditions.push(`telefono ILIKE $${paramIndex}`);
            queryParams.push(`%${telefono}%`);
            paramIndex++;
        }
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = Math.max(parseInt(offset), 0);
        queryParams.push(limitNum, offsetNum);
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const searchQuery = `
      SELECT *
      FROM customers
      ${whereClause}
      ORDER BY fecha_actualizacion DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        const result = await (0, connection_1.query)(searchQuery, queryParams);
        // Contar total de resultados
        const countQuery = `
      SELECT COUNT(*) as total
      FROM customers
      ${whereClause}
    `;
        const countResult = await (0, connection_1.query)(countQuery, queryParams.slice(0, -2));
        res.json({
            customers: result.rows,
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
        console.error('Error buscando clientes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.searchCustomers = searchCustomers;
const getCustomerById = async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        if (isNaN(customerId)) {
            return res.status(400).json({ message: 'ID de cliente inválido' });
        }
        const result = await (0, connection_1.query)('SELECT * FROM customers WHERE customer_id = $1', [customerId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        // Obtener vehículos del cliente
        const vehicles = await (0, connection_1.query)(`
      SELECT vehicle_id, vin, marca, modelo, año, placa_actual, kilometraje_actual, fecha_registro
      FROM vehicles
      WHERE customer_id = $1 AND activo = true
      ORDER BY fecha_actualizacion DESC
    `, [customerId]);
        const customer = {
            ...result.rows[0],
            vehicles: vehicles.rows,
        };
        res.json({ customer });
    }
    catch (error) {
        console.error('Error obteniendo cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        if (isNaN(customerId)) {
            return res.status(400).json({ message: 'ID de cliente inválido' });
        }
        const updateData = updateCustomerSchema.parse(req.body);
        // Verificar que el cliente existe
        const customerExists = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE customer_id = $1', [customerId]);
        if (customerExists.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        // Verificar que el teléfono no esté en uso por otro cliente
        if (updateData.telefono) {
            const phoneExists = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE telefono = $1 AND customer_id != $2', [updateData.telefono, customerId]);
            if (phoneExists.rows.length > 0) {
                return res.status(400).json({ message: 'Este número de teléfono ya está registrado' });
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
        params.push(customerId);
        const updateQuery = `
      UPDATE customers 
      SET ${updates.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE customer_id = $${paramIndex}
      RETURNING *
    `;
        const result = await (0, connection_1.query)(updateQuery, params);
        res.json({
            message: 'Cliente actualizado exitosamente',
            customer: result.rows[0],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error actualizando cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        if (isNaN(customerId)) {
            return res.status(400).json({ message: 'ID de cliente inválido' });
        }
        // Verificar que el cliente existe
        const customerExists = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE customer_id = $1', [customerId]);
        if (customerExists.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        // Verificar si tiene vehículos registrados
        const hasVehicles = await (0, connection_1.query)('SELECT COUNT(*) as count FROM vehicles WHERE customer_id = $1 AND activo = true', [customerId]);
        if (parseInt(hasVehicles.rows[0].count) > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar el cliente porque tiene vehículos registrados. Transfiera los vehículos a otro cliente primero.'
            });
        }
        // Eliminar cliente
        await (0, connection_1.query)('DELETE FROM customers WHERE customer_id = $1', [customerId]);
        res.json({ message: 'Cliente eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.deleteCustomer = deleteCustomer;
const getCustomerVehicles = async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        if (isNaN(customerId)) {
            return res.status(400).json({ message: 'ID de cliente inválido' });
        }
        // Verificar que el cliente existe
        const customerExists = await (0, connection_1.query)('SELECT customer_id, nombre FROM customers WHERE customer_id = $1', [customerId]);
        if (customerExists.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        // Obtener todos los vehículos del cliente (simplificado para evitar errores)
        const vehicles = await (0, connection_1.query)(`
      SELECT 
        v.vehicle_id,
        v.vin,
        v.marca,
        v.modelo,
        v.año,
        v.placa_actual,
        v.kilometraje_actual,
        v.color,
        v.fecha_registro,
        v.fecha_actualizacion
      FROM vehicles v
      WHERE v.customer_id = $1 AND v.activo = true
      ORDER BY v.fecha_actualizacion DESC
    `, [customerId]);
        res.json({
            customer: customerExists.rows[0],
            vehicles: vehicles.rows,
        });
    }
    catch (error) {
        console.error('❌ Error obteniendo vehículos del cliente:', error);
        console.error('🔍 Customer ID solicitado:', req.params.id);
        console.error('📋 Detalle del error:', error instanceof Error ? error.message : 'Error desconocido');
        res.status(500).json({
            message: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Error desconocido' : undefined
        });
    }
};
exports.getCustomerVehicles = getCustomerVehicles;
//# sourceMappingURL=customers.js.map