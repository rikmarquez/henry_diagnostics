import { Response } from 'express';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth';
import type { 
  Mechanic, 
  CreateMechanicRequest, 
  UpdateMechanicRequest, 
  MechanicFilters 
} from '../types';

export const getMechanics = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      branch_id,
      nivel_experiencia,
      especialidad,
      activo,
      page = 1,
      limit = 20
    } = req.query as MechanicFilters;

    let queryString = `
      SELECT 
        m.*,
        b.nombre as branch_nombre
      FROM mechanics m
      LEFT JOIN branches b ON m.branch_id = b.branch_id
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Filtros
    if (search) {
      queryString += ` AND (
        LOWER(m.nombre) LIKE LOWER($${paramIndex}) OR 
        LOWER(m.apellidos) LIKE LOWER($${paramIndex}) OR 
        LOWER(m.alias) LIKE LOWER($${paramIndex}) OR 
        m.numero_empleado LIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (branch_id) {
      queryString += ` AND m.branch_id = $${paramIndex}`;
      queryParams.push(branch_id);
      paramIndex++;
    }

    if (nivel_experiencia) {
      queryString += ` AND m.nivel_experiencia = $${paramIndex}`;
      queryParams.push(nivel_experiencia);
      paramIndex++;
    }

    if (especialidad) {
      queryString += ` AND $${paramIndex} = ANY(m.especialidades)`;
      queryParams.push(especialidad);
      paramIndex++;
    }

    if (activo !== undefined) {
      queryString += ` AND m.activo = $${paramIndex}`;
      queryParams.push(activo);
      paramIndex++;
    }

    // Ordenar
    queryString += ` ORDER BY m.nombre, m.apellidos`;

    // Paginación
    const offset = (Number(page) - 1) * Number(limit);
    queryString += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryString, queryParams);

    // Contar total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM mechanics m
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (
        LOWER(m.nombre) LIKE LOWER($${countParamIndex}) OR 
        LOWER(m.apellidos) LIKE LOWER($${countParamIndex}) OR 
        LOWER(m.alias) LIKE LOWER($${countParamIndex}) OR 
        m.numero_empleado LIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (branch_id) {
      countQuery += ` AND m.branch_id = $${countParamIndex}`;
      countParams.push(branch_id);
      countParamIndex++;
    }

    if (nivel_experiencia) {
      countQuery += ` AND m.nivel_experiencia = $${countParamIndex}`;
      countParams.push(nivel_experiencia);
      countParamIndex++;
    }

    if (especialidad) {
      countQuery += ` AND $${countParamIndex} = ANY(m.especialidades)`;
      countParams.push(especialidad);
      countParamIndex++;
    }

    if (activo !== undefined) {
      countQuery += ` AND m.activo = $${countParamIndex}`;
      countParams.push(activo);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      mechanics: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo mecánicos:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al obtener mecánicos' 
    });
  }
};

export const getMechanicById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const queryString = `
      SELECT 
        m.*,
        b.nombre as branch_nombre
      FROM mechanics m
      LEFT JOIN branches b ON m.branch_id = b.branch_id
      WHERE m.mechanic_id = $1
    `;

    const result = await query(queryString, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mecánico no encontrado' });
    }

    res.json({ mechanic: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo mecánico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al obtener mecánico' 
    });
  }
};

export const createMechanic = async (req: AuthRequest, res: Response) => {
  try {
    const {
      branch_id,
      nombre,
      apellidos,
      alias,
      telefono,
      especialidades = [],
      nivel_experiencia,
      salario_base,
      comision_porcentaje = 0,
      notas
    } = req.body as CreateMechanicRequest;

    // Validaciones básicas
    if (!branch_id || !nombre || !apellidos || !nivel_experiencia) {
      return res.status(400).json({ 
        message: 'Campos requeridos: branch_id, nombre, apellidos, nivel_experiencia' 
      });
    }

    // Generar número de empleado automáticamente
    const countResult = await query('SELECT COUNT(*) as total FROM mechanics');
    const totalMechanics = parseInt(countResult.rows[0].total);
    const numero_empleado = `MEC${String(totalMechanics + 1).padStart(3, '0')}`;

    // Verificar que la sucursal exista
    const branchCheck = await query(
      'SELECT branch_id FROM branches WHERE branch_id = $1',
      [branch_id]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(400).json({ 
        message: 'La sucursal especificada no existe' 
      });
    }

    const insertQuery = `
      INSERT INTO mechanics (
        branch_id, numero_empleado, nombre, apellidos, alias, telefono,
        fecha_ingreso, especialidades, nivel_experiencia, salario_base, comision_porcentaje, notas
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;

    const values = [
      branch_id,
      numero_empleado,
      nombre,
      apellidos,
      alias || null,
      telefono || null,
      new Date().toISOString().split('T')[0], // fecha_ingreso automática
      especialidades,
      nivel_experiencia,
      salario_base || null,
      comision_porcentaje,
      notas || null
    ];

    const result = await query(insertQuery, values);

    console.log('✅ Mecánico creado exitosamente:', {
      mechanic_id: result.rows[0].mechanic_id,
      nombre: `${nombre} ${apellidos}`,
      numero_empleado
    });

    res.status(201).json({
      message: 'Mecánico creado exitosamente',
      mechanic: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error creando mecánico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al crear mecánico' 
    });
  }
};

export const updateMechanic = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateMechanicRequest;

    // Verificar que el mecánico existe
    const mechanicCheck = await query(
      'SELECT mechanic_id FROM mechanics WHERE mechanic_id = $1',
      [id]
    );

    if (mechanicCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Mecánico no encontrado' });
    }


    // Si se está actualizando la sucursal, verificar que exista
    if (updateData.branch_id) {
      const branchCheck = await query(
        'SELECT branch_id FROM branches WHERE branch_id = $1',
        [updateData.branch_id]
      );

      if (branchCheck.rows.length === 0) {
        return res.status(400).json({ 
          message: 'La sucursal especificada no existe' 
        });
      }
    }

    // Construir query dinámico
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos para actualizar' });
    }

    // Agregar fecha_actualizacion
    fields.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE mechanics 
      SET ${fields.join(', ')}
      WHERE mechanic_id = $${paramIndex}
      RETURNING *
    `;

    values.push(id);

    const result = await query(updateQuery, values);

    console.log('✅ Mecánico actualizado exitosamente:', {
      mechanic_id: id,
      campos_actualizados: Object.keys(updateData)
    });

    res.json({
      message: 'Mecánico actualizado exitosamente',
      mechanic: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error actualizando mecánico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al actualizar mecánico' 
    });
  }
};

export const deleteMechanic = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el mecánico existe
    const mechanicCheck = await query(
      'SELECT mechanic_id, nombre, apellidos FROM mechanics WHERE mechanic_id = $1',
      [id]
    );

    if (mechanicCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Mecánico no encontrado' });
    }

    // Verificar si el mecánico tiene servicios asignados
    const servicesCheck = await query(
      'SELECT COUNT(*) as count FROM services WHERE mechanic_id = $1',
      [id]
    );

    const servicesCount = parseInt(servicesCheck.rows[0].count);

    if (servicesCount > 0) {
      // No eliminar, solo desactivar
      await query(
        'UPDATE mechanics SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP WHERE mechanic_id = $1',
        [id]
      );

      console.log('⚠️ Mecánico desactivado (tiene servicios asignados):', {
        mechanic_id: id,
        servicios_asignados: servicesCount
      });

      return res.json({
        message: `Mecánico desactivado exitosamente (tiene ${servicesCount} servicios asignados)`,
        action: 'deactivated'
      });
    } else {
      // Eliminar completamente
      await query('DELETE FROM mechanics WHERE mechanic_id = $1', [id]);

      console.log('✅ Mecánico eliminado exitosamente:', {
        mechanic_id: id,
        nombre: `${mechanicCheck.rows[0].nombre} ${mechanicCheck.rows[0].apellidos}`
      });

      return res.json({
        message: 'Mecánico eliminado exitosamente',
        action: 'deleted'
      });
    }
  } catch (error) {
    console.error('❌ Error eliminando mecánico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al eliminar mecánico' 
    });
  }
};

// Endpoint para obtener sucursales (para dropdown)
export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    const branchQuery = `
      SELECT branch_id, nombre, codigo
      FROM branches
      WHERE activo = true
      ORDER BY nombre
    `;

    const result = await query(branchQuery);

    res.json({ branches: result.rows });
  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al obtener sucursales' 
    });
  }
};

// Endpoint para estadísticas de mecánicos
export const getMechanicsStats = async (req: AuthRequest, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_mechanics,
        COUNT(*) FILTER (WHERE activo = true) as active_mechanics,
        COUNT(*) FILTER (WHERE nivel_experiencia = 'senior') as senior_mechanics,
        COUNT(*) FILTER (WHERE nivel_experiencia = 'master') as master_mechanics,
        AVG(salario_base) FILTER (WHERE salario_base IS NOT NULL) as avg_salary
      FROM mechanics
    `;

    const result = await query(statsQuery);

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo estadísticas de mecánicos:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al obtener estadísticas' 
    });
  }
};