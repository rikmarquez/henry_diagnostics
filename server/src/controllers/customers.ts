import { Response } from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

const phoneSchema = z.string().regex(/^\+52[0-9]{10}$/, 'Formato de teléfono inválido (+5215512345678)');

const customerSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  telefono: phoneSchema,
  rfc: z.string().optional(),
});

const updateCustomerSchema = customerSchema.partial();

const searchSchema = z.object({
  nombre: z.string().optional(),
  telefono: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customerData = customerSchema.parse(req.body);

    // Verificar que el teléfono no esté registrado
    const existingCustomer = await query('SELECT customer_id FROM customers WHERE telefono = $1', [customerData.telefono]);
    if (existingCustomer.rows.length > 0) {
      return res.status(400).json({ message: 'Ya existe un cliente con este número de teléfono' });
    }

    const result = await query(`
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    console.error('Error creando cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const searchCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, telefono, limit = '50', offset = '0' } = searchSchema.parse(req.query);

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
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

    const result = await query(searchQuery, queryParams);

    // Contar total de resultados
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customers
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));

    res.json({
      customers: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parámetros de búsqueda inválidos',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    console.error('Error buscando clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    const result = await query('SELECT * FROM customers WHERE customer_id = $1', [customerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Obtener vehículos del cliente
    const vehicles = await query(`
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
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    const updateData = updateCustomerSchema.parse(req.body);

    // Verificar que el cliente existe
    const customerExists = await query('SELECT customer_id FROM customers WHERE customer_id = $1', [customerId]);
    if (customerExists.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Verificar que el teléfono no esté en uso por otro cliente
    if (updateData.telefono) {
      const phoneExists = await query(
        'SELECT customer_id FROM customers WHERE telefono = $1 AND customer_id != $2',
        [updateData.telefono, customerId]
      );
      if (phoneExists.rows.length > 0) {
        return res.status(400).json({ message: 'Este número de teléfono ya está registrado' });
      }
    }


    // Construir query de actualización dinámicamente
    const updates: string[] = [];
    const params: any[] = [];
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

    const result = await query(updateQuery, params);

    res.json({
      message: 'Cliente actualizado exitosamente',
      customer: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    // Verificar que el cliente existe
    const customerExists = await query('SELECT customer_id FROM customers WHERE customer_id = $1', [customerId]);
    if (customerExists.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Verificar si tiene vehículos registrados
    const hasVehicles = await query('SELECT COUNT(*) as count FROM vehicles WHERE customer_id = $1 AND activo = true', [customerId]);
    if (parseInt(hasVehicles.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el cliente porque tiene vehículos registrados. Transfiera los vehículos a otro cliente primero.' 
      });
    }

    // Eliminar cliente
    await query('DELETE FROM customers WHERE customer_id = $1', [customerId]);

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getCustomerVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    // Verificar que el cliente existe
    const customerExists = await query('SELECT customer_id, nombre FROM customers WHERE customer_id = $1', [customerId]);
    if (customerExists.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Obtener todos los vehículos del cliente (simplificado para evitar errores)
    const vehicles = await query(`
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
  } catch (error) {
    console.error('❌ Error obteniendo vehículos del cliente:', error);
    console.error('🔍 Customer ID solicitado:', req.params.id);
    console.error('📋 Detalle del error:', error instanceof Error ? error.message : 'Error desconocido');
    
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Error desconocido' : undefined
    });
  }
};