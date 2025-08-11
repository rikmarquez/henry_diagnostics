"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCitasParaRecepcion = exports.receptionarCita = exports.convertOpportunityToCita = exports.processWalkInClient = void 0;
const connection_1 = require("../database/connection");
/**
 * RECEPCIÓN DE CLIENTES WALK-IN
 * Maneja clientes que llegan al taller sin cita previa
 */
const processWalkInClient = async (req, res) => {
    const client = await (0, connection_1.getClient)();
    try {
        console.log('🚪 Procesando cliente walk-in con datos:', JSON.stringify(req.body, null, 2));
        await client.query('BEGIN');
        const data = req.body;
        // 1. PROCESAR CLIENTE
        let customerId;
        if (data.cliente_existente_id) {
            customerId = data.cliente_existente_id;
        }
        else if (data.cliente_nuevo) {
            // Crear nuevo cliente
            const customerResult = await client.query(`
        INSERT INTO customers (nombre, telefono, whatsapp, email, direccion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING customer_id
      `, [
                data.cliente_nuevo.nombre,
                data.cliente_nuevo.telefono,
                data.cliente_nuevo.whatsapp,
                data.cliente_nuevo.email,
                data.cliente_nuevo.direccion
            ]);
            customerId = customerResult.rows[0].customer_id;
        }
        else {
            throw new Error('Debe especificar cliente existente o datos de cliente nuevo');
        }
        // 2. PROCESAR VEHÍCULO
        let vehicleId;
        if (data.vehiculo_existente_id) {
            vehicleId = data.vehiculo_existente_id;
        }
        else if (data.vehiculo_nuevo) {
            // Verificar que la placa no exista
            const placaExistente = await client.query('SELECT vehicle_id FROM vehicles WHERE placa_actual = $1 AND activo = true', [data.vehiculo_nuevo.placa_actual]);
            if (placaExistente.rows.length > 0) {
                throw new Error(`Ya existe un vehículo con la placa ${data.vehiculo_nuevo.placa_actual}`);
            }
            // Crear nuevo vehículo
            const vehicleResult = await client.query(`
        INSERT INTO vehicles (marca, modelo, año, placa_actual, customer_id, color, kilometraje_actual)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING vehicle_id
      `, [
                data.vehiculo_nuevo.marca,
                data.vehiculo_nuevo.modelo,
                data.vehiculo_nuevo.año,
                data.vehiculo_nuevo.placa_actual,
                customerId,
                data.vehiculo_nuevo.color,
                data.vehiculo_nuevo.kilometraje_actual || 0
            ]);
            vehicleId = vehicleResult.rows[0].vehicle_id;
        }
        else {
            throw new Error('Debe especificar vehículo existente o datos de vehículo nuevo');
        }
        // 3. PROCESAR ACCIÓN DEL CLIENTE
        let result = {};
        if (data.accion === 'servicio_inmediato') {
            // Crear servicio directamente
            if (!data.servicio_inmediato) {
                throw new Error('Datos de servicio inmediato requeridos');
            }
            // Validar y limpiar datos antes del INSERT
            const tipoServicio = data.servicio_inmediato.tipo_servicio?.trim();
            const descripcion = data.servicio_inmediato.descripcion?.trim() || tipoServicio || 'Servicio general';
            const precio = data.servicio_inmediato.precio_estimado || 0;
            if (!tipoServicio) {
                throw new Error('Tipo de servicio es requerido');
            }
            console.log('📝 Creando servicio con datos:', {
                vehicleId,
                customerId,
                tipoServicio,
                descripcion,
                precio
            });
            const serviceResult = await client.query(`
        INSERT INTO services (
          vehicle_id, customer_id, fecha_servicio, tipo_servicio, 
          descripcion, precio, estado
        )
        VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, 'cotizado')
        RETURNING service_id, *
      `, [
                vehicleId,
                customerId,
                tipoServicio,
                descripcion,
                precio
            ]);
            result = {
                type: 'servicio_inmediato',
                service: serviceResult.rows[0]
            };
        }
        else if (data.accion === 'agendar_cita') {
            // Crear opportunity con cita
            if (!data.cita) {
                throw new Error('Datos de cita requeridos');
            }
            const opportunityResult = await client.query(`
        INSERT INTO opportunities (
          vehicle_id, customer_id, tipo_oportunidad, titulo, descripcion,
          tiene_cita, cita_fecha, cita_hora, cita_descripcion_breve,
          cita_nombre_contacto, cita_telefono_contacto, origen_cita, estado
        )
        VALUES ($1, $2, 'servicio_programado', $3, $4, true, $5, $6, $7, $8, $9, 'walk_in', 'agendado')
        RETURNING opportunity_id, *
      `, [
                vehicleId,
                customerId,
                `Servicio programado - ${data.cita.descripcion_breve}`,
                `Cliente walk-in programó cita para ${data.cita.descripcion_breve}`,
                data.cita.fecha,
                data.cita.hora,
                data.cita.descripcion_breve,
                // Obtener nombre del cliente
                (await client.query('SELECT nombre FROM customers WHERE customer_id = $1', [customerId])).rows[0].nombre,
                // Obtener teléfono del cliente
                (await client.query('SELECT telefono FROM customers WHERE customer_id = $1', [customerId])).rows[0].telefono
            ]);
            result = {
                type: 'cita_agendada',
                opportunity: opportunityResult.rows[0]
            };
        }
        await client.query('COMMIT');
        res.status(201).json({
            message: 'Cliente walk-in procesado exitosamente',
            customer_id: customerId,
            vehicle_id: vehicleId,
            result
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error procesando cliente walk-in:', error);
        // Log detallado del error
        if (error instanceof Error) {
            console.error('📋 Detalle del error:', {
                message: error.message,
                stack: error.stack
            });
        }
        res.status(500).json({
            error: 'Error procesando cliente walk-in',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
    finally {
        client.release();
    }
};
exports.processWalkInClient = processWalkInClient;
/**
 * CONVERTIR OPPORTUNITY EN CITA
 * Para cuando el seguimiento contacta un cliente y acepta agendar
 */
const convertOpportunityToCita = async (req, res) => {
    try {
        const data = req.body;
        // Verificar que la opportunity existe
        const opportunityCheck = await (0, connection_1.query)('SELECT * FROM opportunities WHERE opportunity_id = $1', [data.opportunity_id]);
        if (opportunityCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Opportunity no encontrada' });
        }
        const opportunity = opportunityCheck.rows[0];
        // Obtener datos del cliente para contacto
        const customerResult = await (0, connection_1.query)('SELECT nombre, telefono FROM customers WHERE customer_id = $1', [opportunity.customer_id]);
        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        const customer = customerResult.rows[0];
        // Actualizar opportunity para convertirla en cita
        const result = await (0, connection_1.query)(`
      UPDATE opportunities 
      SET 
        tiene_cita = true,
        cita_fecha = $1,
        cita_hora = $2,
        cita_descripcion_breve = servicio_sugerido,
        cita_nombre_contacto = $3,
        cita_telefono_contacto = $4,
        origen_cita = 'opportunity',
        estado = 'agendado',
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE opportunity_id = $5
      RETURNING *
    `, [
            data.cita_fecha,
            data.cita_hora,
            customer.nombre,
            customer.telefono,
            data.opportunity_id
        ]);
        res.json({
            message: 'Opportunity convertida en cita exitosamente',
            opportunity: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error convirtiendo opportunity en cita:', error);
        res.status(500).json({
            error: 'Error convirtiendo opportunity en cita',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.convertOpportunityToCita = convertOpportunityToCita;
/**
 * RECEPCIONAR CITA (cuando cliente llega)
 * Convierte una cita en un servicio real
 */
const receptionarCita = async (req, res) => {
    const client = await (0, connection_1.getClient)();
    try {
        await client.query('BEGIN');
        const { opportunity_id } = req.params;
        const { tipo_servicio, descripcion, precio_estimado, usuario_mecanico } = req.body;
        // Obtener la cita
        const opportunityResult = await client.query(`
      SELECT o.*, c.nombre as cliente_nombre, v.marca, v.modelo, v.placa_actual
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
      WHERE o.opportunity_id = $1 AND o.tiene_cita = true
    `, [opportunity_id]);
        if (opportunityResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        const opportunity = opportunityResult.rows[0];
        // Verificar que tiene vehículo y cliente
        if (!opportunity.vehicle_id || !opportunity.customer_id) {
            return res.status(400).json({
                error: 'Esta cita no tiene vehículo o cliente asignado. Use processWalkInClient primero.'
            });
        }
        // Crear el servicio
        const serviceResult = await client.query(`
      INSERT INTO services (
        vehicle_id, customer_id, usuario_mecanico, fecha_servicio, 
        tipo_servicio, descripcion, precio, estado
      )
      VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, 'cotizado')
      RETURNING service_id, *
    `, [
            opportunity.vehicle_id,
            opportunity.customer_id,
            usuario_mecanico,
            tipo_servicio || opportunity.servicio_sugerido || 'Servicio general',
            descripcion || opportunity.descripcion,
            precio_estimado || opportunity.precio_estimado || 0
        ]);
        // Actualizar la opportunity
        await client.query(`
      UPDATE opportunities 
      SET estado = 'en_proceso', fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE opportunity_id = $1
    `, [opportunity_id]);
        await client.query('COMMIT');
        res.status(201).json({
            message: 'Cita recepcionada exitosamente',
            service: serviceResult.rows[0],
            opportunity: opportunity
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error recepcionando cita:', error);
        res.status(500).json({
            error: 'Error recepcionando cita',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
    finally {
        client.release();
    }
};
exports.receptionarCita = receptionarCita;
/**
 * LISTAR CITAS DEL DÍA PARA RECEPCIÓN
 */
const getCitasParaRecepcion = async (req, res) => {
    try {
        const { fecha } = req.query;
        const fechaBuscar = fecha || new Date().toISOString().split('T')[0];
        const result = await (0, connection_1.query)(`
      SELECT 
        o.opportunity_id,
        o.cita_fecha,
        o.cita_hora,
        o.cita_nombre_contacto,
        o.cita_telefono_contacto,
        o.cita_descripcion_breve,
        o.origen_cita,
        o.estado,
        o.vehicle_id,
        o.customer_id,
        c.nombre as cliente_completo,
        v.marca,
        v.modelo,
        v.placa_actual,
        CASE 
          WHEN o.vehicle_id IS NULL OR o.customer_id IS NULL THEN 'cita_rapida'
          ELSE 'cita_completa'
        END as tipo_cita
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
      WHERE o.tiene_cita = true 
        AND o.cita_fecha = $1
        AND o.estado IN ('agendado', 'en_proceso')
      ORDER BY o.cita_hora ASC
    `, [fechaBuscar]);
        res.json({
            fecha: fechaBuscar,
            citas: result.rows
        });
    }
    catch (error) {
        console.error('Error obteniendo citas para recepción:', error);
        res.status(500).json({
            error: 'Error obteniendo citas para recepción',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.getCitasParaRecepcion = getCitasParaRecepcion;
//# sourceMappingURL=reception.js.map