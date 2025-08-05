"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointment = exports.getRemindersToday = exports.getOpportunitiesByVin = exports.addOpportunityNote = exports.updateOpportunity = exports.getOpportunityById = exports.searchOpportunities = exports.createOpportunity = void 0;
const zod_1 = require("zod");
const connection_1 = require("../database/connection");
const vinSchema = zod_1.z.string().min(1, 'VIN requerido');
const opportunitySchema = zod_1.z.object({
    vin: vinSchema,
    customer_id: zod_1.z.number().int().positive('ID de cliente inválido'),
    usuario_asignado: zod_1.z.number().int().positive('ID de usuario asignado inválido').optional(),
    tipo_oportunidad: zod_1.z.string().min(1, 'Tipo de oportunidad requerido'),
    titulo: zod_1.z.string().optional(), // Ya no requerido
    descripcion: zod_1.z.string().min(1, 'Nota requerida'),
    servicio_sugerido: zod_1.z.string().optional(),
    precio_estimado: zod_1.z.number().positive('Precio debe ser positivo').optional(),
    fecha_sugerida: zod_1.z.string().optional(),
    prioridad: zod_1.z.enum(['alta', 'media', 'baja']).default('media'),
    kilometraje_referencia: zod_1.z.number().int().min(0, 'Kilometraje no puede ser negativo').optional(),
});
const updateOpportunitySchema = opportunitySchema.partial().omit({ vin: true });
const searchSchema = zod_1.z.object({
    vin: zod_1.z.string().optional(),
    customer_id: zod_1.z.string().optional(),
    estado: zod_1.z.string().optional(),
    fecha_desde: zod_1.z.string().optional(),
    fecha_hasta: zod_1.z.string().optional(),
    usuario_asignado: zod_1.z.string().optional(),
    prioridad: zod_1.z.string().optional(),
    tiene_cita: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    offset: zod_1.z.string().optional(),
});
const appointmentSchema = zod_1.z.object({
    cita_fecha: zod_1.z.string().min(1, 'Fecha de cita requerida'),
    cita_hora: zod_1.z.string().min(1, 'Hora de cita requerida'),
    cita_descripcion_breve: zod_1.z.string().min(1, 'Descripción del vehículo requerida'),
    cita_telefono_contacto: zod_1.z.string().min(1, 'Teléfono de contacto requerido'),
    cita_nombre_contacto: zod_1.z.string().min(1, 'Nombre de contacto requerido'),
    titulo: zod_1.z.string().optional(),
    descripcion: zod_1.z.string().optional(),
});
const noteSchema = zod_1.z.object({
    tipo_contacto: zod_1.z.enum(['llamada', 'whatsapp', 'visita', 'email', 'nota_interna']).optional(),
    resultado: zod_1.z.enum(['contactado', 'no_contesta', 'ocupado', 'interesado', 'no_interesado', 'agendado']).optional(),
    notas: zod_1.z.string().min(1, 'Notas requeridas'),
    seguimiento_requerido: zod_1.z.boolean().default(false),
    fecha_seguimiento: zod_1.z.string().optional(),
});
const createOpportunity = async (req, res) => {
    try {
        const opportunityData = opportunitySchema.parse(req.body);
        // Verificar que el vehículo existe
        const vehicleExists = await (0, connection_1.query)('SELECT vin, vehicle_id FROM vehicles WHERE vin = $1 AND activo = true', [opportunityData.vin]);
        if (vehicleExists.rows.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        // Verificar que el cliente existe
        const customerExists = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE customer_id = $1', [opportunityData.customer_id]);
        if (customerExists.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        // Verificar usuario asignado si se proporciona
        if (opportunityData.usuario_asignado) {
            const userExists = await (0, connection_1.query)('SELECT user_id FROM users WHERE user_id = $1 AND activo = true', [opportunityData.usuario_asignado]);
            if (userExists.rows.length === 0) {
                return res.status(404).json({ message: 'Usuario asignado no encontrado' });
            }
        }
        // Calcular fecha de contacto sugerida (7 días antes de la fecha sugerida)
        let fechaContactoSugerida = null;
        if (opportunityData.fecha_sugerida) {
            const fechaSugerida = new Date(opportunityData.fecha_sugerida);
            fechaContactoSugerida = new Date(fechaSugerida);
            fechaContactoSugerida.setDate(fechaContactoSugerida.getDate() - 7);
        }
        const result = await (0, connection_1.query)(`
      INSERT INTO opportunities (
        vehicle_id, customer_id, usuario_creador, usuario_asignado, tipo_oportunidad, titulo, descripcion,
        servicio_sugerido, precio_estimado, fecha_sugerida, fecha_contacto_sugerida, prioridad,
        kilometraje_referencia, origen
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
            vehicleExists.rows[0].vehicle_id,
            opportunityData.customer_id,
            req.user?.user_id,
            opportunityData.usuario_asignado || null,
            opportunityData.tipo_oportunidad,
            opportunityData.titulo || opportunityData.tipo_oportunidad.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Usar tipo como título por defecto
            opportunityData.descripcion,
            opportunityData.servicio_sugerido || null,
            opportunityData.precio_estimado || null,
            opportunityData.fecha_sugerida || null,
            fechaContactoSugerida,
            opportunityData.prioridad,
            opportunityData.kilometraje_referencia || null,
            'manual'
        ]);
        res.status(201).json({
            message: 'Oportunidad creada exitosamente',
            opportunity: result.rows[0],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error creando oportunidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.createOpportunity = createOpportunity;
const searchOpportunities = async (req, res) => {
    try {
        const { vin, customer_id, estado, fecha_desde, fecha_hasta, usuario_asignado, prioridad, tiene_cita, limit = '50', offset = '0' } = searchSchema.parse(req.query);
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;
        if (vin) {
            whereConditions.push(`v.vin = $${paramIndex}`);
            queryParams.push(vin);
            paramIndex++;
        }
        if (customer_id) {
            whereConditions.push(`o.customer_id = $${paramIndex}`);
            queryParams.push(parseInt(customer_id));
            paramIndex++;
        }
        if (estado) {
            whereConditions.push(`o.estado = $${paramIndex}`);
            queryParams.push(estado);
            paramIndex++;
        }
        if (fecha_desde) {
            if (tiene_cita === 'true') {
                whereConditions.push(`o.cita_fecha >= $${paramIndex}`);
            }
            else {
                whereConditions.push(`o.fecha_sugerida >= $${paramIndex}`);
            }
            queryParams.push(fecha_desde);
            paramIndex++;
        }
        if (fecha_hasta) {
            if (tiene_cita === 'true') {
                whereConditions.push(`o.cita_fecha <= $${paramIndex}`);
            }
            else {
                whereConditions.push(`o.fecha_sugerida <= $${paramIndex}`);
            }
            queryParams.push(fecha_hasta);
            paramIndex++;
        }
        if (usuario_asignado) {
            whereConditions.push(`o.usuario_asignado = $${paramIndex}`);
            queryParams.push(parseInt(usuario_asignado));
            paramIndex++;
        }
        if (prioridad) {
            whereConditions.push(`o.prioridad = $${paramIndex}`);
            queryParams.push(prioridad);
            paramIndex++;
        }
        if (tiene_cita) {
            whereConditions.push(`o.tiene_cita = $${paramIndex}`);
            queryParams.push(tiene_cita === 'true');
            paramIndex++;
        }
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = Math.max(parseInt(offset), 0);
        queryParams.push(limitNum, offsetNum);
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const searchQuery = `
      SELECT 
        o.*,
        c.nombre as customer_nombre,
        c.telefono as customer_telefono,
        c.whatsapp as customer_whatsapp,
        v.marca as vehicle_marca,
        v.modelo as vehicle_modelo,
        v."año" as vehicle_año,
        v.placa_actual as vehicle_placa,
        u_creador.nombre as usuario_creador_nombre,
        u_asignado.nombre as usuario_asignado_nombre
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
      LEFT JOIN users u_creador ON o.usuario_creador = u_creador.user_id
      LEFT JOIN users u_asignado ON o.usuario_asignado = u_asignado.user_id
      ${whereClause}
      ORDER BY 
        CASE o.prioridad 
          WHEN 'alta' THEN 1 
          WHEN 'media' THEN 2 
          WHEN 'baja' THEN 3 
        END,
        o.fecha_contacto_sugerida ASC,
        o.fecha_creacion DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        const result = await (0, connection_1.query)(searchQuery, queryParams);
        // Contar total de resultados
        const countQuery = `
      SELECT COUNT(*) as total
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
      ${whereClause}
    `;
        const countResult = await (0, connection_1.query)(countQuery, queryParams.slice(0, -2));
        res.json({
            opportunities: result.rows,
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
        console.error('Error buscando oportunidades:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.searchOpportunities = searchOpportunities;
const getOpportunityById = async (req, res) => {
    try {
        const opportunityId = parseInt(req.params.id);
        if (isNaN(opportunityId)) {
            return res.status(400).json({ message: 'ID de oportunidad inválido' });
        }
        const result = await (0, connection_1.query)(`
      SELECT 
        o.*,
        c.nombre as customer_nombre,
        c.telefono as customer_telefono,
        c.whatsapp as customer_whatsapp,
        c.email as customer_email,
        v.marca as vehicle_marca,
        v.modelo as vehicle_modelo,
        v."año" as vehicle_año,
        v.placa_actual as vehicle_placa,
        v.kilometraje_actual as vehicle_kilometraje,
        u_creador.nombre as usuario_creador_nombre,
        u_asignado.nombre as usuario_asignado_nombre
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
      LEFT JOIN users u_creador ON o.usuario_creador = u_creador.user_id
      LEFT JOIN users u_asignado ON o.usuario_asignado = u_asignado.user_id
      WHERE o.opportunity_id = $1
    `, [opportunityId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Oportunidad no encontrada' });
        }
        // Obtener notas de seguimiento
        const notes = await (0, connection_1.query)(`
      SELECT 
        on.*,
        u.nombre as usuario_nombre
      FROM opportunity_notes on
      LEFT JOIN users u ON on.usuario_id = u.user_id
      WHERE on.opportunity_id = $1
      ORDER BY on.fecha_contacto DESC
    `, [opportunityId]);
        const opportunity = {
            ...result.rows[0],
            notes: notes.rows,
        };
        res.json({ opportunity });
    }
    catch (error) {
        console.error('Error obteniendo oportunidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getOpportunityById = getOpportunityById;
const updateOpportunity = async (req, res) => {
    try {
        const opportunityId = parseInt(req.params.id);
        if (isNaN(opportunityId)) {
            return res.status(400).json({ message: 'ID de oportunidad inválido' });
        }
        const updateData = updateOpportunitySchema.parse(req.body);
        // Verificar que la oportunidad existe
        const opportunityExists = await (0, connection_1.query)('SELECT opportunity_id FROM opportunities WHERE opportunity_id = $1', [opportunityId]);
        if (opportunityExists.rows.length === 0) {
            return res.status(404).json({ message: 'Oportunidad no encontrada' });
        }
        // Verificar cliente si se proporciona
        if (updateData.customer_id) {
            const customerExists = await (0, connection_1.query)('SELECT customer_id FROM customers WHERE customer_id = $1', [updateData.customer_id]);
            if (customerExists.rows.length === 0) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }
        }
        // Verificar usuario asignado si se proporciona
        if (updateData.usuario_asignado) {
            const userExists = await (0, connection_1.query)('SELECT user_id FROM users WHERE user_id = $1 AND activo = true', [updateData.usuario_asignado]);
            if (userExists.rows.length === 0) {
                return res.status(404).json({ message: 'Usuario asignado no encontrado' });
            }
        }
        // Construir query de actualización dinámicamente
        const updates = [];
        const params = [];
        let paramIndex = 1;
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'fecha_sugerida' && value) {
                    // Actualizar también fecha de contacto sugerida
                    updates.push(`${key} = $${paramIndex}`);
                    params.push(value);
                    paramIndex++;
                    // Calcular nueva fecha de contacto (7 días antes)
                    const fechaSugerida = new Date(value);
                    const fechaContacto = new Date(fechaSugerida);
                    fechaContacto.setDate(fechaContacto.getDate() - 7);
                    updates.push(`fecha_contacto_sugerida = $${paramIndex}`);
                    params.push(fechaContacto.toISOString().split('T')[0]);
                    paramIndex++;
                }
                else {
                    updates.push(`${key} = $${paramIndex}`);
                    params.push(value);
                    paramIndex++;
                }
            }
        });
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos para actualizar' });
        }
        params.push(opportunityId);
        const updateQuery = `
      UPDATE opportunities 
      SET ${updates.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE opportunity_id = $${paramIndex}
      RETURNING *
    `;
        const result = await (0, connection_1.query)(updateQuery, params);
        res.json({
            message: 'Oportunidad actualizada exitosamente',
            opportunity: result.rows[0],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error actualizando oportunidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.updateOpportunity = updateOpportunity;
const addOpportunityNote = async (req, res) => {
    try {
        const opportunityId = parseInt(req.params.id);
        if (isNaN(opportunityId)) {
            return res.status(400).json({ message: 'ID de oportunidad inválido' });
        }
        const noteData = noteSchema.parse(req.body);
        // Verificar que la oportunidad existe
        const opportunityExists = await (0, connection_1.query)('SELECT opportunity_id FROM opportunities WHERE opportunity_id = $1', [opportunityId]);
        if (opportunityExists.rows.length === 0) {
            return res.status(404).json({ message: 'Oportunidad no encontrada' });
        }
        const result = await (0, connection_1.query)(`
      INSERT INTO opportunity_notes (
        opportunity_id, usuario_id, tipo_contacto, resultado, notas, seguimiento_requerido, fecha_seguimiento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
            opportunityId,
            req.user?.user_id,
            noteData.tipo_contacto || null,
            noteData.resultado || null,
            noteData.notas,
            noteData.seguimiento_requerido,
            noteData.fecha_seguimiento || null,
        ]);
        res.status(201).json({
            message: 'Nota agregada exitosamente',
            note: result.rows[0],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error agregando nota:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.addOpportunityNote = addOpportunityNote;
const getOpportunitiesByVin = async (req, res) => {
    try {
        const vin = vinSchema.parse(req.params.vin);
        const result = await (0, connection_1.query)(`
      SELECT 
        o.*,
        c.nombre as customer_nombre,
        u_asignado.nombre as usuario_asignado_nombre
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN users u_asignado ON o.usuario_asignado = u_asignado.user_id
      LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
      WHERE v.vin = $1
      ORDER BY o.fecha_creacion DESC
    `, [vin]);
        res.json({
            opportunities: result.rows,
            total: result.rows.length,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'VIN inválido',
                errors: error.errors.map(e => e.message),
            });
        }
        console.error('Error obteniendo oportunidades por VIN:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getOpportunitiesByVin = getOpportunitiesByVin;
const getRemindersToday = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await (0, connection_1.query)(`
      SELECT 
        o.*,
        c.nombre as customer_nombre,
        c.telefono as customer_telefono,
        c.whatsapp as customer_whatsapp,
        v.marca as vehicle_marca,
        v.modelo as vehicle_modelo,
        v.placa_actual as vehicle_placa
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
      WHERE o.fecha_contacto_sugerida <= $1 
        AND o.estado IN ('pendiente', 'contactado')
      ORDER BY o.prioridad = 'alta' DESC, o.fecha_contacto_sugerida ASC
    `, [today]);
        res.json({
            reminders: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error('Error obteniendo recordatorios:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getRemindersToday = getRemindersToday;
const createAppointment = async (req, res) => {
    try {
        const appointmentData = appointmentSchema.parse(req.body);
        // Crear la cita como oportunidad SIN crear vehículo o cliente
        // Solo guardamos los datos básicos en los campos de cita
        const result = await (0, connection_1.query)(`
      INSERT INTO opportunities (
        usuario_creador, tipo_oportunidad, titulo, descripcion,
        estado, prioridad, origen, tiene_cita, cita_fecha, cita_hora, 
        cita_descripcion_breve, cita_telefono_contacto, cita_nombre_contacto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
            req.user?.user_id,
            'cita_agendada',
            appointmentData.titulo || `Cita - ${appointmentData.cita_descripcion_breve}`,
            appointmentData.descripcion || `Cita agendada para ${appointmentData.cita_nombre_contacto} - ${appointmentData.cita_descripcion_breve}`,
            'agendado',
            'media',
            'manual',
            true,
            appointmentData.cita_fecha,
            appointmentData.cita_hora,
            appointmentData.cita_descripcion_breve,
            appointmentData.cita_telefono_contacto,
            appointmentData.cita_nombre_contacto
        ]);
        res.status(201).json({
            message: 'Cita creada exitosamente',
            appointment: result.rows[0],
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            });
        }
        console.error('Error creando cita:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.createAppointment = createAppointment;
//# sourceMappingURL=opportunities.js.map