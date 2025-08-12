"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMechanicsStats = exports.getBranches = exports.deleteMechanic = exports.updateMechanic = exports.createMechanic = exports.getMechanicById = exports.getMechanics = void 0;
const connection_1 = require("../database/connection");
const getMechanics = async (req, res) => {
    try {
        const { search, branch_id, nivel_experiencia, especialidad, activo, page = 1, limit = 20 } = req.query;
        let queryString = `
      SELECT 
        m.*,
        b.nombre as branch_nombre
      FROM mechanics m
      LEFT JOIN branches b ON m.branch_id = b.branch_id
      WHERE 1=1
    `;
        const queryParams = [];
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
        const result = await (0, connection_1.query)(queryString, queryParams);
        // Contar total
        let countQuery = `
      SELECT COUNT(*) as total
      FROM mechanics m
      WHERE 1=1
    `;
        const countParams = [];
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
        const countResult = await (0, connection_1.query)(countQuery, countParams);
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
    }
    catch (error) {
        console.error('Error obteniendo mecánicos:', error);
        res.status(500).json({
            message: 'Error interno del servidor al obtener mecánicos'
        });
    }
};
exports.getMechanics = getMechanics;
const getMechanicById = async (req, res) => {
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
        const result = await (0, connection_1.query)(queryString, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mecánico no encontrado' });
        }
        res.json({ mechanic: result.rows[0] });
    }
    catch (error) {
        console.error('Error obteniendo mecánico:', error);
        res.status(500).json({
            message: 'Error interno del servidor al obtener mecánico'
        });
    }
};
exports.getMechanicById = getMechanicById;
const createMechanic = async (req, res) => {
    try {
        const { branch_id, numero_empleado, nombre, apellidos, alias, telefono, email, fecha_nacimiento, fecha_ingreso, especialidades = [], certificaciones = [], nivel_experiencia, salario_base, comision_porcentaje = 0, horario_trabajo, notas } = req.body;
        // Validaciones básicas
        if (!branch_id || !numero_empleado || !nombre || !apellidos || !nivel_experiencia) {
            return res.status(400).json({
                message: 'Campos requeridos: branch_id, numero_empleado, nombre, apellidos, nivel_experiencia'
            });
        }
        // Verificar que el número de empleado no exista
        const employeeCheck = await (0, connection_1.query)('SELECT mechanic_id FROM mechanics WHERE numero_empleado = $1', [numero_empleado]);
        if (employeeCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'El número de empleado ya existe'
            });
        }
        // Verificar que la sucursal exista
        const branchCheck = await (0, connection_1.query)('SELECT branch_id FROM branches WHERE branch_id = $1', [branch_id]);
        if (branchCheck.rows.length === 0) {
            return res.status(400).json({
                message: 'La sucursal especificada no existe'
            });
        }
        const insertQuery = `
      INSERT INTO mechanics (
        branch_id, numero_empleado, nombre, apellidos, alias, telefono, email,
        fecha_nacimiento, fecha_ingreso, especialidades, certificaciones,
        nivel_experiencia, salario_base, comision_porcentaje, horario_trabajo, notas
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;
        const values = [
            branch_id,
            numero_empleado,
            nombre,
            apellidos,
            alias || null,
            telefono || null,
            email || null,
            fecha_nacimiento || null,
            fecha_ingreso || new Date().toISOString().split('T')[0],
            especialidades,
            certificaciones,
            nivel_experiencia,
            salario_base || null,
            comision_porcentaje,
            horario_trabajo || null,
            notas || null
        ];
        const result = await (0, connection_1.query)(insertQuery, values);
        console.log('✅ Mecánico creado exitosamente:', {
            mechanic_id: result.rows[0].mechanic_id,
            nombre: `${nombre} ${apellidos}`,
            numero_empleado
        });
        res.status(201).json({
            message: 'Mecánico creado exitosamente',
            mechanic: result.rows[0]
        });
    }
    catch (error) {
        console.error('❌ Error creando mecánico:', error);
        res.status(500).json({
            message: 'Error interno del servidor al crear mecánico'
        });
    }
};
exports.createMechanic = createMechanic;
const updateMechanic = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Verificar que el mecánico existe
        const mechanicCheck = await (0, connection_1.query)('SELECT mechanic_id FROM mechanics WHERE mechanic_id = $1', [id]);
        if (mechanicCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Mecánico no encontrado' });
        }
        // Si se está actualizando el número de empleado, verificar que no exista
        if (updateData.numero_empleado) {
            const employeeCheck = await (0, connection_1.query)('SELECT mechanic_id FROM mechanics WHERE numero_empleado = $1 AND mechanic_id != $2', [updateData.numero_empleado, id]);
            if (employeeCheck.rows.length > 0) {
                return res.status(400).json({
                    message: 'El número de empleado ya existe'
                });
            }
        }
        // Si se está actualizando la sucursal, verificar que exista
        if (updateData.branch_id) {
            const branchCheck = await (0, connection_1.query)('SELECT branch_id FROM branches WHERE branch_id = $1', [updateData.branch_id]);
            if (branchCheck.rows.length === 0) {
                return res.status(400).json({
                    message: 'La sucursal especificada no existe'
                });
            }
        }
        // Construir query dinámico
        const fields = [];
        const values = [];
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
        const result = await (0, connection_1.query)(updateQuery, values);
        console.log('✅ Mecánico actualizado exitosamente:', {
            mechanic_id: id,
            campos_actualizados: Object.keys(updateData)
        });
        res.json({
            message: 'Mecánico actualizado exitosamente',
            mechanic: result.rows[0]
        });
    }
    catch (error) {
        console.error('❌ Error actualizando mecánico:', error);
        res.status(500).json({
            message: 'Error interno del servidor al actualizar mecánico'
        });
    }
};
exports.updateMechanic = updateMechanic;
const deleteMechanic = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar que el mecánico existe
        const mechanicCheck = await (0, connection_1.query)('SELECT mechanic_id, nombre, apellidos FROM mechanics WHERE mechanic_id = $1', [id]);
        if (mechanicCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Mecánico no encontrado' });
        }
        // Verificar si el mecánico tiene servicios asignados
        const servicesCheck = await (0, connection_1.query)('SELECT COUNT(*) as count FROM services WHERE mechanic_id = $1', [id]);
        const servicesCount = parseInt(servicesCheck.rows[0].count);
        if (servicesCount > 0) {
            // No eliminar, solo desactivar
            await (0, connection_1.query)('UPDATE mechanics SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP WHERE mechanic_id = $1', [id]);
            console.log('⚠️ Mecánico desactivado (tiene servicios asignados):', {
                mechanic_id: id,
                servicios_asignados: servicesCount
            });
            return res.json({
                message: `Mecánico desactivado exitosamente (tiene ${servicesCount} servicios asignados)`,
                action: 'deactivated'
            });
        }
        else {
            // Eliminar completamente
            await (0, connection_1.query)('DELETE FROM mechanics WHERE mechanic_id = $1', [id]);
            console.log('✅ Mecánico eliminado exitosamente:', {
                mechanic_id: id,
                nombre: `${mechanicCheck.rows[0].nombre} ${mechanicCheck.rows[0].apellidos}`
            });
            return res.json({
                message: 'Mecánico eliminado exitosamente',
                action: 'deleted'
            });
        }
    }
    catch (error) {
        console.error('❌ Error eliminando mecánico:', error);
        res.status(500).json({
            message: 'Error interno del servidor al eliminar mecánico'
        });
    }
};
exports.deleteMechanic = deleteMechanic;
// Endpoint para obtener sucursales (para dropdown)
const getBranches = async (req, res) => {
    try {
        const branchQuery = `
      SELECT branch_id, nombre, codigo
      FROM branches
      WHERE activo = true
      ORDER BY nombre
    `;
        const result = await (0, connection_1.query)(branchQuery);
        res.json({ branches: result.rows });
    }
    catch (error) {
        console.error('Error obteniendo sucursales:', error);
        res.status(500).json({
            message: 'Error interno del servidor al obtener sucursales'
        });
    }
};
exports.getBranches = getBranches;
// Endpoint para estadísticas de mecánicos
const getMechanicsStats = async (req, res) => {
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
        const result = await (0, connection_1.query)(statsQuery);
        res.json({ stats: result.rows[0] });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas de mecánicos:', error);
        res.status(500).json({
            message: 'Error interno del servidor al obtener estadísticas'
        });
    }
};
exports.getMechanicsStats = getMechanicsStats;
//# sourceMappingURL=mechanics.js.map