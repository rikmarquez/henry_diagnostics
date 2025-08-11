import { Response } from 'express';
import { query, getClient } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

/**
 * CONTROLADOR DE SERVICIOS
 * Maneja todas las operaciones relacionadas con servicios de mantenimiento
 */

// Obtener estadísticas de servicios
export const getServiceStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalResult, thisMonthResult, pendingResult, incomeResult, statusResult] = await Promise.all([
      // Total de servicios
      query('SELECT COUNT(*) as total FROM services'),
      
      // Servicios este mes
      query(`
        SELECT COUNT(*) as count
        FROM services 
        WHERE EXTRACT(YEAR FROM fecha_servicio) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM fecha_servicio) = EXTRACT(MONTH FROM CURRENT_DATE)
      `),
      
      // Servicios pendientes (cotizado, autorizado, en_proceso)
      query(`
        SELECT COUNT(*) as count 
        FROM services 
        WHERE estado IN ('cotizado', 'autorizado', 'en_proceso')
      `),
      
      // Ingresos del mes
      query(`
        SELECT COALESCE(SUM(precio), 0) as ingresos
        FROM services 
        WHERE EXTRACT(YEAR FROM fecha_servicio) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM fecha_servicio) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND estado IN ('completado')
      `),
      
      // Servicios por estado
      query(`
        SELECT estado, COUNT(*) as count
        FROM services 
        GROUP BY estado
        ORDER BY count DESC
      `)
    ]);

    res.json({
      total_servicios: parseInt(totalResult.rows[0].total),
      servicios_mes_actual: parseInt(thisMonthResult.rows[0].count),
      servicios_pendientes: parseInt(pendingResult.rows[0].count),
      ingresos_mes: parseFloat(incomeResult.rows[0].ingresos),
      servicios_por_estado: statusResult.rows
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de servicios:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas de servicios',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener contador de servicios del mes actual
export const getServiceCountThisMonth = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM services 
      WHERE EXTRACT(YEAR FROM fecha_servicio) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha_servicio) = EXTRACT(MONTH FROM CURRENT_DATE)
    `);

    res.json({ count: parseInt(result.rows[0].count) });

  } catch (error) {
    console.error('Error obteniendo contador de servicios del mes:', error);
    res.status(500).json({ 
      error: 'Error obteniendo contador de servicios',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Listar servicios con filtros y paginación
export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      estado,
      cliente,
      vehiculo,
      mechanic_id,
      branch_id,
      page = '1',
      limit = '50'
    } = req.query;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Construir filtros
    if (fecha_desde) {
      whereConditions.push(`s.fecha_servicio >= $${paramIndex}`);
      queryParams.push(fecha_desde);
      paramIndex++;
    }

    if (fecha_hasta) {
      whereConditions.push(`s.fecha_servicio <= $${paramIndex}`);
      queryParams.push(fecha_hasta);
      paramIndex++;
    }

    if (estado) {
      whereConditions.push(`s.estado = $${paramIndex}`);
      queryParams.push(estado);
      paramIndex++;
    }

    if (cliente) {
      whereConditions.push(`c.nombre ILIKE $${paramIndex}`);
      queryParams.push(`%${cliente}%`);
      paramIndex++;
    }

    if (vehiculo) {
      whereConditions.push(`(v.marca ILIKE $${paramIndex} OR v.modelo ILIKE $${paramIndex} OR v.placa_actual ILIKE $${paramIndex})`);
      queryParams.push(`%${vehiculo}%`);
      paramIndex++;
    }

    if (mechanic_id) {
      whereConditions.push(`s.mechanic_id = $${paramIndex}`);
      queryParams.push(mechanic_id);
      paramIndex++;
    }

    if (branch_id) {
      whereConditions.push(`s.branch_id = $${paramIndex}`);
      queryParams.push(branch_id);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Paginación
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = (parseInt(page as string) - 1) * limitNum;

    queryParams.push(limitNum, offsetNum);

    // Consulta principal con JOIN para obtener datos relacionados
    const servicesQuery = `
      SELECT 
        s.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        v.marca || ' ' || v.modelo || ' ' || v.año as vehiculo_descripcion,
        v.marca as vehiculo_marca,
        v.modelo as vehiculo_modelo,
        v.año as vehiculo_año,
        v.placa_actual,
        COALESCE(
          m.nombre || ' ' || m.apellidos,
          u.nombre
        ) as mecanico_nombre,
        b.nombre as sucursal_nombre
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.customer_id
      LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      LEFT JOIN mechanics m ON s.mechanic_id = m.mechanic_id
      LEFT JOIN users u ON s.usuario_mecanico = u.user_id
      LEFT JOIN branches b ON s.branch_id = b.branch_id
      ${whereClause}
      ORDER BY s.fecha_creacion DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Consulta para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.customer_id
      LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      ${whereClause}
    `;

    const [servicesResult, countResult] = await Promise.all([
      query(servicesQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2))
    ]);

    res.json({
      services: servicesResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      limit: limitNum,
      total_pages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum)
    });

  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({ 
      error: 'Error obteniendo servicios',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener servicio por ID
export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        s.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.email as cliente_email,
        v.marca || ' ' || v.modelo || ' ' || v.año as vehiculo_descripcion,
        v.marca as vehiculo_marca,
        v.modelo as vehiculo_modelo,
        v.año as vehiculo_año,
        v.placa_actual,
        v.kilometraje_actual,
        COALESCE(
          m.nombre || ' ' || m.apellidos,
          u.nombre
        ) as mecanico_nombre,
        b.nombre as sucursal_nombre
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.customer_id
      LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      LEFT JOIN mechanics m ON s.mechanic_id = m.mechanic_id
      LEFT JOIN users u ON s.usuario_mecanico = u.user_id
      LEFT JOIN branches b ON s.branch_id = b.branch_id
      WHERE s.service_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ service: result.rows[0] });

  } catch (error) {
    console.error('Error obteniendo servicio por ID:', error);
    res.status(500).json({ 
      error: 'Error obteniendo servicio',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener servicios recientes
export const getRecentServices = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    
    const result = await query(`
      SELECT 
        s.*,
        c.nombre as cliente_nombre,
        v.marca || ' ' || v.modelo || ' ' || v.año as vehiculo_descripcion,
        v.placa_actual,
        COALESCE(
          m.nombre || ' ' || m.apellidos,
          u.nombre
        ) as mecanico_nombre
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.customer_id
      LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      LEFT JOIN mechanics m ON s.mechanic_id = m.mechanic_id
      LEFT JOIN users u ON s.usuario_mecanico = u.user_id
      ORDER BY s.fecha_creacion DESC
      LIMIT $1
    `, [limit]);

    res.json({ services: result.rows });

  } catch (error) {
    console.error('Error obteniendo servicios recientes:', error);
    res.status(500).json({ 
      error: 'Error obteniendo servicios recientes',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Actualizar estado de servicio
export const updateServiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    const validStates = ['cotizado', 'autorizado', 'en_proceso', 'completado', 'cancelado'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({ error: 'Estado de servicio inválido' });
    }

    let updateFields = ['estado = $2'];
    let queryParams = [id, estado];
    let paramIndex = 3;

    if (notas) {
      updateFields.push(`notas = $${paramIndex}`);
      queryParams.push(notas);
      paramIndex++;
    }

    const result = await query(`
      UPDATE services 
      SET ${updateFields.join(', ')}
      WHERE service_id = $1
      RETURNING *
    `, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({
      message: 'Estado de servicio actualizado exitosamente',
      service: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando estado de servicio:', error);
    res.status(500).json({ 
      error: 'Error actualizando estado de servicio',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Actualizar servicio completo
export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      tipo_servicio,
      descripcion,
      precio,
      estado,
      notas,
      kilometraje_servicio,
      refacciones_usadas,
      proximo_servicio_km,
      proximo_servicio_fecha,
      garantia_meses
    } = req.body;

    // Validar estado si se proporciona
    if (estado) {
      const validStates = ['cotizado', 'autorizado', 'en_proceso', 'completado', 'cancelado'];
      if (!validStates.includes(estado)) {
        return res.status(400).json({ error: 'Estado de servicio inválido' });
      }
    }

    // Construir campos a actualizar dinámicamente
    let updateFields: string[] = [];
    let queryParams: any[] = [id];
    let paramIndex = 2;

    if (tipo_servicio !== undefined) {
      updateFields.push(`tipo_servicio = $${paramIndex}`);
      queryParams.push(tipo_servicio);
      paramIndex++;
    }

    if (descripcion !== undefined) {
      updateFields.push(`descripcion = $${paramIndex}`);
      queryParams.push(descripcion);
      paramIndex++;
    }

    if (precio !== undefined) {
      updateFields.push(`precio = $${paramIndex}`);
      queryParams.push(precio);
      paramIndex++;
    }

    if (estado !== undefined) {
      updateFields.push(`estado = $${paramIndex}`);
      queryParams.push(estado);
      paramIndex++;
    }

    if (notas !== undefined) {
      updateFields.push(`notas = $${paramIndex}`);
      queryParams.push(notas);
      paramIndex++;
    }

    if (kilometraje_servicio !== undefined) {
      updateFields.push(`kilometraje_servicio = $${paramIndex}`);
      queryParams.push(kilometraje_servicio);
      paramIndex++;
    }

    if (refacciones_usadas !== undefined) {
      updateFields.push(`refacciones_usadas = $${paramIndex}`);
      queryParams.push(refacciones_usadas);
      paramIndex++;
    }

    if (proximo_servicio_km !== undefined) {
      updateFields.push(`proximo_servicio_km = $${paramIndex}`);
      queryParams.push(proximo_servicio_km);
      paramIndex++;
    }

    if (proximo_servicio_fecha !== undefined) {
      updateFields.push(`proximo_servicio_fecha = $${paramIndex}`);
      queryParams.push(proximo_servicio_fecha);
      paramIndex++;
    }

    if (garantia_meses !== undefined) {
      updateFields.push(`garantia_meses = $${paramIndex}`);
      queryParams.push(garantia_meses);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const result = await query(`
      UPDATE services 
      SET ${updateFields.join(', ')}
      WHERE service_id = $1
      RETURNING *
    `, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({
      message: 'Servicio actualizado exitosamente',
      service: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando servicio:', error);
    res.status(500).json({ 
      error: 'Error actualizando servicio',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};